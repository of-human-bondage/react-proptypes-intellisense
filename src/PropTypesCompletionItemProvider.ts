import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CompletionItem,
    CompletionItemKind,
    commands,
    Location,
    Uri,
    workspace
} from 'vscode';
import { parse } from 'babylon';
import {
    File,
    ClassDeclaration,
    Identifier,
    AssignmentExpression,
    MemberExpression,
    ObjectExpression,
    JSXOpeningElement,
    JSXIdentifier,
    JSXAttribute
} from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
    private getObjProperties(
        obj: ObjectExpression,
        scope: Scope,
        propertiesToRemove: string[]
    ): string[] {
        const result: string[] = [];

        babelTraverse(
            obj,
            {
                ObjectProperty(path) {
                    const objectPropertyKey = <Identifier>path.node.key;

                    // without inner property
                    if (
                        path.parent === obj &&
                        propertiesToRemove.indexOf(objectPropertyKey.name) < 0
                    ) {
                        result.push(objectPropertyKey.name);
                    }
                }
            },
            scope
        );

        return result;
    }

    private getComponentPropTypesFromStatic(
        componentName: string,
        ast: File,
        alreadyProvidedProps: string[]
    ): string[] {
        let component: ClassDeclaration | undefined;
        let scope: Scope | undefined;
        let propTypes: ObjectExpression | undefined;

        babelTraverse(ast, {
            ClassDeclaration(path) {
                if (path.node.id.name === componentName) {
                    component = path.node;
                    scope = path.scope;
                }
            }
        });

        if (!component || !scope) {
            return [];
        }

        babelTraverse(
            component,
            {
                ClassProperty(path) {
                    if (path.node.key.name === 'propTypes') {
                        propTypes = <ObjectExpression>path.node.value;
                    }
                }
            },
            scope
        );

        if (!propTypes) {
            return [];
        }

        return this.getObjProperties(propTypes, scope, alreadyProvidedProps);
    }

    private getComponentPropTypesFromProperty(
        componentName: string,
        ast: File,
        alreadyProvidedProps: string[]
    ): string[] {
        let scope: Scope | undefined;
        let propTypes: ObjectExpression | undefined;

        babelTraverse(ast, {
            ExpressionStatement(path) {
                const expression = <AssignmentExpression>path.node.expression;
                const left = <MemberExpression>expression.left;
                const leftObject = <Identifier>left.object;
                const leftProperty = <Identifier>left.property;

                const right = <ObjectExpression>expression.right;

                if (leftObject.name === componentName && leftProperty.name === 'propTypes') {
                    propTypes = right;
                    scope = path.scope;
                }
            }
        });

        if (!propTypes || !scope) {
            return [];
        }

        return this.getObjProperties(propTypes, scope, alreadyProvidedProps);
    }

    private getComponentPropTypesFromPrototype(
        componentName: string,
        ast: File,
        alreadyProvidedProps: string[]
    ): string[] {
        let scope: Scope | undefined;
        let propTypes: ObjectExpression | undefined;

        babelTraverse(ast, {
            ExpressionStatement(path) {
                const expression = <AssignmentExpression>path.node.expression;
                const left = <MemberExpression>expression.left;
                const leftObject = <Identifier>(<MemberExpression>left.object).object;
                const leftProperty = <Identifier>left.property;

                const right = <ObjectExpression>expression.right;

                if (leftObject.name === componentName && leftProperty.name === 'propTypes') {
                    propTypes = right;
                    scope = path.scope;
                }
            }
        });

        if (!propTypes || !scope) {
            return [];
        }

        return this.getObjProperties(propTypes, scope, alreadyProvidedProps);
    }

    private getComponentPropTypes(
        componentName: string,
        ast: File,
        alreadyProvidedProps: string[]
    ): string[] {
        const componentPropTypesFromStatic = this.getComponentPropTypesFromStatic(
            componentName,
            ast,
            alreadyProvidedProps
        );
        if (componentPropTypesFromStatic.length) {
            return componentPropTypesFromStatic;
        }

        const componentPropTypesFromProperty = this.getComponentPropTypesFromProperty(
            componentName,
            ast,
            alreadyProvidedProps
        );
        if (componentPropTypesFromProperty.length) {
            return componentPropTypesFromProperty;
        }

        const componentPropTypesFromPrototype = this.getComponentPropTypesFromPrototype(
            componentName,
            ast,
            alreadyProvidedProps
        );
        if (componentPropTypesFromPrototype.length) {
            return componentPropTypesFromPrototype;
        }

        return [];
    }

    private async getDefinition(
        documentUri: Uri,
        position: Position
    ): Promise<Location | undefined> {
        const definitions = <{}[]>await commands.executeCommand(
            'vscode.executeDefinitionProvider',
            documentUri,
            position
        );

        if (!definitions.length) {
            return undefined;
        }

        return <Location>definitions[0];
    }

    private getPropTypesFromJsxTag(jsxOpeningElement: JSXOpeningElement): string[] {
        return jsxOpeningElement.attributes.map((jsxAttribute: JSXAttribute): string => {
            return (<JSXIdentifier>jsxAttribute.name).name;
        });
    }

    private isReactComponent(nameOfJsxTag: string): boolean {
        return nameOfJsxTag[0] === nameOfJsxTag[0].toUpperCase();
    }

    private getAst(fileText: string): File {
        return parse(fileText, {
            sourceType: 'module',
            plugins: [
                'jsx',
                'flow',
                'doExpressions',
                'objectRestSpread',
                'decorators',
                'classProperties',
                'exportExtensions',
                'asyncGenerators',
                'functionBind',
                'functionSent',
                'dynamicImport'
            ]
        });
    }

    private getStartTagPosition(jsxOpeningElement: JSXOpeningElement): Position {
        return new Position(
            jsxOpeningElement.loc.start.line - 1,
            jsxOpeningElement.loc.start.column + 1
        );
    }

    private getNameOfJsxTag(jsxOpeningElement: JSXOpeningElement): string {
        return (<JSXIdentifier>jsxOpeningElement.name).name;
    }

    private getJsxOpeningElement(
        document: TextDocument,
        position: Position
    ): JSXOpeningElement | undefined {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);

        const ast = this.getAst(documentText);

        let result: JSXOpeningElement | undefined;

        babelTraverse(ast, {
            JSXOpeningElement(path) {
                const jsxOpeningElement = <JSXOpeningElement>path.node;

                if (
                    cursorPosition > jsxOpeningElement.start &&
                    cursorPosition < jsxOpeningElement.end
                ) {
                    result = jsxOpeningElement;
                }
            }
        });

        return result;
    }

    public async provideCompletionItems(
        document: TextDocument,
        position: Position
    ): Promise<CompletionItem[]> {
        const jsxOpeningElement = this.getJsxOpeningElement(document, position);
        if (!jsxOpeningElement) {
            return [];
        }

        const nameOfJsxTag = this.getNameOfJsxTag(jsxOpeningElement);
        const isReactComponent = this.isReactComponent(nameOfJsxTag);
        if (!isReactComponent) {
            return [];
        }

        const startTagPosition = this.getStartTagPosition(jsxOpeningElement);
        const tagDefinition = await this.getDefinition(document.uri, startTagPosition);
        if (!tagDefinition) {
            return [];
        }

        const componentTextDocument = await workspace.openTextDocument(tagDefinition.uri);
        const componentName = componentTextDocument.getText(tagDefinition.range);
        const ast = this.getAst(componentTextDocument.getText());

        const parsedPropTypes = this.getPropTypesFromJsxTag(jsxOpeningElement);

        return this.getComponentPropTypes(componentName, ast, parsedPropTypes).map(propType => {
            return new CompletionItem(propType, CompletionItemKind.Field);
        });
    }
}

import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CompletionItem,
    CompletionItemKind,
    commands,
    Location,
    Uri,
    workspace,
    Range
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
    JSXAttribute,
    SourceLocation,
    ObjectProperty
} from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
    private sourceLocationToRange(sourceLocation: SourceLocation): Range {
        return new Range(
            new Position(sourceLocation.start.line - 1, sourceLocation.start.column),
            new Position(sourceLocation.end.line - 1, sourceLocation.end.column)
        );
    }

    private getCompletionItem(
        objectProperty: ObjectProperty,
        componentTextDocument: TextDocument
    ): CompletionItem {
        const objectPropertyKey = <Identifier>objectProperty.key;

        const completionItem = new CompletionItem(objectPropertyKey.name, CompletionItemKind.Field);
        completionItem.sortText = ''; // move on the top of the list
        completionItem.detail = componentTextDocument.getText(
            this.sourceLocationToRange(objectProperty.value.loc)
        );

        return completionItem;
    }

    private getCompletionItems(
        componentTextDocument: TextDocument,
        obj: ObjectExpression,
        scope: Scope,
        propertiesToRemove: string[]
    ): CompletionItem[] {
        const result: CompletionItem[] = [];

        babelTraverse(
            obj,
            {
                ObjectProperty: path => {
                    const objectPropertyKey = <Identifier>path.node.key;

                    // without inner property
                    if (
                        path.parent === obj &&
                        propertiesToRemove.indexOf(objectPropertyKey.name) < 0
                    ) {
                        result.push(this.getCompletionItem(path.node, componentTextDocument));
                    }
                }
            },
            scope
        );

        return result;
    }

    private getComponentPropTypesFromStatic(
        componentTextDocument: TextDocument,
        ast: File,
        componentName: string,
        alreadyProvidedProps: string[]
    ): CompletionItem[] {
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

        return this.getCompletionItems(
            componentTextDocument,
            propTypes,
            scope,
            alreadyProvidedProps
        );
    }

    private getComponentPropTypesFromProperty(
        componentTextDocument: TextDocument,
        ast: File,
        componentName: string,
        alreadyProvidedProps: string[]
    ): CompletionItem[] {
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

        return this.getCompletionItems(
            componentTextDocument,
            propTypes,
            scope,
            alreadyProvidedProps
        );
    }

    private getComponentPropTypesFromPrototype(
        componentTextDocument: TextDocument,
        ast: File,
        componentName: string,
        alreadyProvidedProps: string[]
    ): CompletionItem[] {
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

        return this.getCompletionItems(
            componentTextDocument,
            propTypes,
            scope,
            alreadyProvidedProps
        );
    }

    private getComponentPropTypes(
        componentTextDocument: TextDocument,
        componentName: string,
        alreadyProvidedProps: string[]
    ): CompletionItem[] {
        const ast = this.getAst(componentTextDocument.getText());

        const componentPropTypesFromStatic = this.getComponentPropTypesFromStatic(
            componentTextDocument,
            ast,
            componentName,
            alreadyProvidedProps
        );
        if (componentPropTypesFromStatic.length) {
            return componentPropTypesFromStatic;
        }

        const componentPropTypesFromProperty = this.getComponentPropTypesFromProperty(
            componentTextDocument,
            ast,
            componentName,
            alreadyProvidedProps
        );
        if (componentPropTypesFromProperty.length) {
            return componentPropTypesFromProperty;
        }

        const componentPropTypesFromPrototype = this.getComponentPropTypesFromPrototype(
            componentTextDocument,
            ast,
            componentName,
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

        const parsedPropTypes = this.getPropTypesFromJsxTag(jsxOpeningElement);

        return this.getComponentPropTypes(componentTextDocument, componentName, parsedPropTypes);
    }
}

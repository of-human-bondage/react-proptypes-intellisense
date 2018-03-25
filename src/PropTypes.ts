import { Uri, Range, CompletionItem, TextDocument, workspace, CompletionItemKind } from 'vscode';

import {
    File,
    ClassDeclaration,
    ObjectExpression,
    ObjectProperty,
    Identifier,
    AssignmentExpression,
    MemberExpression
} from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import { getAst, sourceLocationToRange } from './utils';

export default class PropTypes {
    private componentUri: Uri;
    private componentNameLocation: Range;

    constructor(componentUri: Uri, componentNameLocation: Range) {
        this.componentUri = componentUri;
        this.componentNameLocation = componentNameLocation;
    }

    private getCompletionItem(
        objectProperty: ObjectProperty,
        componentTextDocument: TextDocument
    ): CompletionItem {
        const objectPropertyKey = <Identifier>objectProperty.key;

        const completionItem = new CompletionItem(objectPropertyKey.name, CompletionItemKind.Field);
        completionItem.sortText = ''; // move on the top of the list
        completionItem.detail = componentTextDocument.getText(
            sourceLocationToRange(objectProperty.value.loc)
        );

        return completionItem;
    }

    private getCompletionItems(
        componentTextDocument: TextDocument,
        obj: ObjectExpression,
        scope: Scope
    ): CompletionItem[] {
        const result: CompletionItem[] = [];

        babelTraverse(
            obj,
            {
                ObjectProperty: path => {
                    // without inner property
                    if (path.parent === obj) {
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
        componentName: string
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

        return this.getCompletionItems(componentTextDocument, propTypes, scope);
    }

    private getComponentPropTypesFromPrototype(
        componentTextDocument: TextDocument,
        ast: File,
        componentName: string
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

        return this.getCompletionItems(componentTextDocument, propTypes, scope);
    }

    private getComponentPropTypesFromProperty(
        componentTextDocument: TextDocument,
        ast: File,
        componentName: string
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

        return this.getCompletionItems(componentTextDocument, propTypes, scope);
    }

    private async getComponentTextDocument(): Promise<TextDocument> {
        return workspace.openTextDocument(this.componentUri);
    }

    private getComponentName(componentTextDocument: TextDocument): string {
        return componentTextDocument.getText(this.componentNameLocation);
    }

    public async getPropTypes(): Promise<CompletionItem[]> {
        const componentTextDocument = await this.getComponentTextDocument();
        const componentName = this.getComponentName(componentTextDocument);

        const ast = getAst(componentTextDocument.getText());

        const componentPropTypesFromStatic = this.getComponentPropTypesFromStatic(
            componentTextDocument,
            ast,
            componentName
        );
        if (componentPropTypesFromStatic.length) {
            return componentPropTypesFromStatic;
        }

        const componentPropTypesFromProperty = this.getComponentPropTypesFromProperty(
            componentTextDocument,
            ast,
            componentName
        );
        if (componentPropTypesFromProperty.length) {
            return componentPropTypesFromProperty;
        }

        const componentPropTypesFromPrototype = this.getComponentPropTypesFromPrototype(
            componentTextDocument,
            ast,
            componentName
        );
        if (componentPropTypesFromPrototype.length) {
            return componentPropTypesFromPrototype;
        }

        return [];
    }
}

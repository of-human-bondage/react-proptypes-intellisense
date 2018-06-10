import babelTraverse, { Scope } from 'babel-traverse';
import {
    JSXAttribute,
    JSXIdentifier,
    JSXOpeningElement,
    JSXSpreadAttribute,
    Node
} from 'babel-types';
import { CompletionItem, CompletionItemProvider, Position, TextDocument } from 'vscode';

import getPropTypes from './getPropTypes';
import { getAst, getDefinition, isReactComponent, isPathToTypingFile } from './utils';

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
    private getPropTypesFromJsxTag(jsxOpeningElement: JSXOpeningElement): string[] {
        return jsxOpeningElement.attributes.map(
            (jsxAttribute: JSXAttribute | JSXSpreadAttribute): string => {
                if ('argument' in jsxAttribute) {
                    return '...={}';
                }

                return `${(<JSXAttribute>jsxAttribute).name.name}={}`;
            }
        );
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

    private isCursorInJsxOpeningElement(
        cursorPosition: number,
        jsxOpeningElement: JSXOpeningElement
    ): boolean {
        return cursorPosition > jsxOpeningElement.start && cursorPosition < jsxOpeningElement.end;
    }

    private isCursorInJsxAttribute(cursorPosition: number, node: Node, scope: Scope): boolean {
        let result: boolean = false;

        babelTraverse(
            node,
            {
                JSXAttribute(path) {
                    const jsxAttribute = path.node;

                    if (cursorPosition > jsxAttribute.start && cursorPosition < jsxAttribute.end) {
                        result = true;
                    }
                }
            },
            scope
        );

        return result;
    }

    private getJsxOpeningElement(
        document: TextDocument,
        position: Position
    ): JSXOpeningElement | undefined {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);

        const ast = getAst(documentText);
        if (!ast) {
            return undefined;
        }

        let result: JSXOpeningElement | undefined;

        babelTraverse(ast, {
            JSXOpeningElement: path => {
                const jsxOpeningElement = path.node;

                const isCursorInJsxOpeningElement = this.isCursorInJsxOpeningElement(
                    cursorPosition,
                    jsxOpeningElement
                );

                const isCursorInJsxAttribute = this.isCursorInJsxAttribute(
                    cursorPosition,
                    jsxOpeningElement,
                    path.scope
                );

                if (isCursorInJsxOpeningElement && !isCursorInJsxAttribute) {
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
        if (!isReactComponent(nameOfJsxTag)) {
            return [];
        }

        const startTagPosition = this.getStartTagPosition(jsxOpeningElement);
        const tagDefinition = await getDefinition(document.uri, startTagPosition);
        if (!tagDefinition || isPathToTypingFile(tagDefinition.uri.path)) {
            return [];
        }

        const parsedPropTypes = this.getPropTypesFromJsxTag(jsxOpeningElement);

        const propTypes = (await getPropTypes(tagDefinition.uri, tagDefinition.range)).filter(
            propType => parsedPropTypes.indexOf(<string>propType.insertText) === -1
        );

        return propTypes;
    }
}

import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CompletionItem,
    commands,
    Location,
    Uri
} from 'vscode';

import { JSXOpeningElement, JSXIdentifier, JSXAttribute } from 'babel-types';
import babelTraverse from 'babel-traverse';

import getPropTypes from './getPropTypes';
import { getAst } from './utils';

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
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

        const ast = getAst(documentText);

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

        const parsedPropTypes = this.getPropTypesFromJsxTag(jsxOpeningElement);

        const propTypes = (await getPropTypes(tagDefinition.uri, tagDefinition.range)).filter(
            propType => {
                return parsedPropTypes.indexOf(propType.label) === -1;
            }
        );

        return propTypes;
    }
}

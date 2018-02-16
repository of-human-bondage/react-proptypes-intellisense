import * as path from 'path';
import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    CompletionItem,
    ExtensionContext,
    workspace
} from 'vscode';

import { parse } from 'babylon';
import { Node, ImportDeclaration, File } from 'babel-types';

const START_TAG_CHARACTER = '<';
const END_TAG_CHARACTER = '>';

const BABYLON_CONFIG = {
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
};

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
    private _extensionContext: ExtensionContext;

    constructor(extensionContext: ExtensionContext) {
        this._extensionContext = extensionContext;
    }

    private getJsxTag(documentText: string, cursorPosition: number): string {
        let startTagPosition = cursorPosition;
        let endTagPosition = cursorPosition;

        for (let i = startTagPosition; i > 0; i--) {
            if (documentText[i] === START_TAG_CHARACTER) {
                startTagPosition = i;

                break;
            }
        }

        for (let i = endTagPosition; i < documentText.length; i++) {
            if (documentText[i] === END_TAG_CHARACTER) {
                endTagPosition = i;

                break;
            }
        }

        return documentText.slice(startTagPosition, endTagPosition + 1).replace(/\s{2,}/g, ' ');
    }

    private getNameOfJsxTag(jsxTag: string): string {
        return jsxTag.slice(1).split(' ')[0];
    }

    private isReactComponent(nameOfJsxTag: string): boolean {
        return nameOfJsxTag[0] === nameOfJsxTag[0].toUpperCase();
    }

    private getAstFile(fileText: string): File {
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

    private getComponentUrl(documentText: string, nameOfComponent: string): string | undefined {
        // TODO: optimization of casting
        const bodyOfAstFile = this.getAstFile(documentText).program.body;
        const importDeclarations = <ImportDeclaration[]>bodyOfAstFile.filter(
            (node: Node): boolean => node.type === 'ImportDeclaration'
        );

        const astOfComponent = importDeclarations.find(
            (importDeclaration: ImportDeclaration): boolean => {
                return !!importDeclaration.specifiers.find(
                    specifier => specifier.local.name === nameOfComponent
                );
            }
        );

        if (astOfComponent) {
            return astOfComponent.source.value;
        }

        return undefined;
    }

    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): CompletionItem[] {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);

        const jsxTag = this.getJsxTag(documentText, cursorPosition);
        const nameOfJsxTag = this.getNameOfJsxTag(jsxTag);
        const isReactComponent = this.isReactComponent(nameOfJsxTag);
        if (!isReactComponent) {
            return [];
        }

        let fileUrl = this.getComponentUrl(documentText, nameOfJsxTag);
        if (!fileUrl) {
            return [];
        }
        // TODO: add workspace
        fileUrl = path.join(path.dirname(document.uri.fsPath), fileUrl);

        return [];
    }
}

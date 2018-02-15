"use strict";
import {
    languages,
    ExtensionContext,
    CompletionItemProvider,
    ProviderResult,
    CompletionItem,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext
} from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    languages.registerCompletionItemProvider("javascriptreact", {
        provideCompletionItems: (
            document: TextDocument,
            position: Position,
            token: CancellationToken,
            context: CompletionContext
        ): ProviderResult<CompletionItem[]> => {
            return null;
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}

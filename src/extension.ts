"use strict";
import {
    languages,
    ExtensionContext,
    CompletionItemProvider,
    ProviderResult,
    CompletionItem
} from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    languages.registerCompletionItemProvider("javascriptreact", {
        provideCompletionItems: (
            ...args: any[]
        ): ProviderResult<CompletionItem[]> => {
            return null;
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}

import { languages } from 'vscode';

import PropTypesCompletionItemProvider from './PropTypesCompletionItemProvider';

export function activate() {
    const propTypesCompletionItemProvider = new PropTypesCompletionItemProvider();

    languages.registerCompletionItemProvider(
        ['javascript', 'javascriptreact'],
        propTypesCompletionItemProvider
    );
}

export function deactivate() {}

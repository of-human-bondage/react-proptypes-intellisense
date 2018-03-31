import { CompletionItem } from 'vscode';

export function pathEquals(path1: string, path2: string): boolean {
    if (process.platform !== 'linux') {
        path1 = path1.toLowerCase();
        path2 = path2.toLowerCase();
    }

    return path1 === path2;
}

export function completionItemsEquals(
    completionItem1: CompletionItem,
    completionItem2: CompletionItem
) {
    return (
        completionItem1.detail === completionItem2.detail &&
        completionItem1.label === completionItem2.label &&
        completionItem1.kind === completionItem2.kind
    );
}

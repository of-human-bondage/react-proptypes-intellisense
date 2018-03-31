import { TextDocument, CompletionItem, CompletionItemKind, MarkdownString, commands } from 'vscode';

import { ObjectExpression, ObjectProperty, Identifier } from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import * as prettier from 'prettier';

import { sourceLocationToRange } from './utils';

const PRETTIER_OPTIONS: prettier.Options = {
    tabWidth: 4,
    semi: false
};

const getMarkdownString = (str: string): MarkdownString => {
    const formattedStr = prettier.format(str, PRETTIER_OPTIONS);

    return new MarkdownString().appendCodeblock(formattedStr);
};

const getCompletionItem = (
    objectProperty: ObjectProperty,
    componentTextDocument: TextDocument
): CompletionItem => {
    const objectPropertyKey = <Identifier>objectProperty.key;

    const completionItem = new CompletionItem(objectPropertyKey.name, CompletionItemKind.Field);
    completionItem.sortText = ''; // move on the top of the list
    completionItem.detail = `(property) ${objectPropertyKey.name}`;
    completionItem.documentation = getMarkdownString(
        componentTextDocument.getText(sourceLocationToRange(objectProperty.value.loc))
    );

    return completionItem;
};

export default (
    componentTextDocument: TextDocument,
    obj: ObjectExpression,
    scope: Scope
): CompletionItem[] => {
    const result: CompletionItem[] = [];

    babelTraverse(
        obj,
        {
            ObjectProperty: path => {
                // without inner property
                if (path.parent === obj) {
                    result.push(getCompletionItem(path.node, componentTextDocument));
                }
            }
        },
        scope
    );

    return result;
};

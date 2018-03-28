import { TextDocument, CompletionItem, CompletionItemKind } from 'vscode';

import { ObjectExpression, ObjectProperty, Identifier } from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import { sourceLocationToRange } from './utils';

const getCompletionItem = (
    objectProperty: ObjectProperty,
    componentTextDocument: TextDocument
): CompletionItem => {
    const objectPropertyKey = <Identifier>objectProperty.key;

    const completionItem = new CompletionItem(objectPropertyKey.name, CompletionItemKind.Field);
    completionItem.sortText = ''; // move on the top of the list
    completionItem.detail = componentTextDocument.getText(
        sourceLocationToRange(objectProperty.value.loc)
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

import { TextDocument, CompletionItem, CompletionItemKind, MarkdownString, commands } from 'vscode';

import { ObjectExpression, ObjectProperty, Identifier } from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import { sourceLocationToRange, formatJSString, isRequiredPropType } from './utils';

const getMarkdownString = (str: string): MarkdownString => {
    return new MarkdownString().appendCodeblock(formatJSString(str));
};

const getCompletionItem = (
    objectProperty: ObjectProperty,
    componentTextDocument: TextDocument
): CompletionItem => {
    const objectPropertyName = (<Identifier>objectProperty.key).name;
    const objectPropertyValue = componentTextDocument.getText(
        sourceLocationToRange(objectProperty.value.loc)
    );

    const propTypeName = `${objectPropertyName}${
        isRequiredPropType(objectPropertyValue) ? '?' : ''
    }`;

    const completionItem = new CompletionItem(propTypeName, CompletionItemKind.Field);
    completionItem.sortText = ''; // move on the top of the list
    completionItem.detail = `(property) ${propTypeName}`;
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

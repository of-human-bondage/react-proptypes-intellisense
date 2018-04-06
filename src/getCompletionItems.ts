import { TextDocument, CompletionItem, CompletionItemKind, MarkdownString } from 'vscode';

import { ObjectExpression, ObjectProperty, Identifier } from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import { sourceLocationToRange, formatJSString, isRequiredPropType } from './utils';

const MOVE_CURSOR_TO_LEFT = {
    title: 'cursorMove',
    command: 'cursorMove',
    arguments: [
        {
            to: 'left'
        }
    ]
};

const getMinimalPropTypeDetail = (propTypeValue: string): string => {
    const separatedPropTypeValue = propTypeValue.split(/\(|\)/g);

    if (separatedPropTypeValue.length > 2) {
        return `${separatedPropTypeValue[0]}(...)${
            separatedPropTypeValue[separatedPropTypeValue.length - 1]
        }`;
    }

    return propTypeValue;
};

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
        isRequiredPropType(objectPropertyValue) ? '' : '?'
    }`;
    const detail = `(property) ${objectPropertyName}: ${getMinimalPropTypeDetail(
        objectPropertyValue
    )}`;
    const documentation = getMarkdownString(objectPropertyValue);

    const completionItem = new CompletionItem(propTypeName, CompletionItemKind.Field);
    completionItem.sortText = ''; // move on the top of the list
    completionItem.insertText = `${objectPropertyName}={}`;
    completionItem.command = MOVE_CURSOR_TO_LEFT;
    completionItem.detail = detail;
    completionItem.documentation = documentation;

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

import { TextDocument, CompletionItem } from 'vscode';

import {
    File,
    ObjectExpression,
    AssignmentExpression,
    MemberExpression,
    Identifier
} from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import getCompletionItems from './getCompletionItems';

export default (
    componentTextDocument: TextDocument,
    ast: File,
    componentName: string
): CompletionItem[] => {
    let scope: Scope | undefined;
    let propTypes: ObjectExpression | undefined;

    babelTraverse(ast, {
        ExpressionStatement(path) {
            const expression = <AssignmentExpression>path.node.expression;
            const left = <MemberExpression>expression.left;
            const leftObject = <Identifier>left.object;
            const leftProperty = <Identifier>left.property;

            const right = <ObjectExpression>expression.right;

            if (leftObject.name === componentName && leftProperty.name === 'propTypes') {
                propTypes = right;
                scope = path.scope;
            }
        }
    });

    if (!propTypes || !scope) {
        return [];
    }

    return getCompletionItems(componentTextDocument, propTypes, scope);
};

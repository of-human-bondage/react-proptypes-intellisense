import { TextDocument, CompletionItem } from 'vscode';

import { File, ClassDeclaration, ObjectExpression } from 'babel-types';
import babelTraverse, { Scope } from 'babel-traverse';

import getCompletionItems from './getCompletionItems';

export default (
    componentTextDocument: TextDocument,
    ast: File,
    componentName: string
): CompletionItem[] => {
    let component: ClassDeclaration | undefined;
    let scope: Scope | undefined;
    let propTypes: ObjectExpression | undefined;

    babelTraverse(ast, {
        ClassDeclaration(path) {
            if (path.node.id.name === componentName) {
                component = path.node;
                scope = path.scope;
            }
        }
    });

    babelTraverse(
        component!,
        {
            ClassProperty(path) {
                if (path.node.key.name === 'propTypes') {
                    propTypes = <ObjectExpression>path.node.value;
                }
            }
        },
        scope
    );

    if (!propTypes) {
        return [];
    }

    return getCompletionItems(componentTextDocument, propTypes, scope!);
};

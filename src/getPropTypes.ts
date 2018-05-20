import { Uri, Range, workspace, TextDocument, CompletionItem } from 'vscode';

import { getAst } from './utils';

import getPropTypesFromStatic from './getPropTypesFromStatic';
import getPropTypesFromProperty from './getPropTypesFromProperty';
import getPropTypesFromPrototype from './getPropTypesFromPrototype';

const getComponentTextDocument = async (componentUri: Uri): Promise<TextDocument> => {
    return workspace.openTextDocument(componentUri);
};

const getComponentName = (
    componentTextDocument: TextDocument,
    componentNameLocation: Range
): string => {
    return componentTextDocument.getText(componentNameLocation);
};

export default async (
    componentUri: Uri,
    componentNameLocation: Range
): Promise<CompletionItem[]> => {
    const componentTextDocument = await getComponentTextDocument(componentUri);
    const componentName = getComponentName(componentTextDocument, componentNameLocation);

    const ast = getAst(componentTextDocument.getText());
    if (!ast) {
        return [];
    }

    const componentPropTypesFromStatic = getPropTypesFromStatic(
        componentTextDocument,
        ast,
        componentName
    );
    if (componentPropTypesFromStatic.length) {
        return componentPropTypesFromStatic;
    }

    const componentPropTypesFromProperty = getPropTypesFromProperty(
        componentTextDocument,
        ast,
        componentName
    );
    if (componentPropTypesFromProperty.length) {
        return componentPropTypesFromProperty;
    }

    const componentPropTypesFromPrototype = getPropTypesFromPrototype(
        componentTextDocument,
        ast,
        componentName
    );
    if (componentPropTypesFromPrototype.length) {
        return componentPropTypesFromPrototype;
    }

    return [];
};

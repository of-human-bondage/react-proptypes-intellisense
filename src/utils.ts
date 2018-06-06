import { File, SourceLocation } from 'babel-types';
import { parse } from 'babylon';
import * as prettier from 'prettier';
import { Location, Position, Range, Uri, commands } from 'vscode';
import { basename } from 'path';

export const getAst = (fileText: string): File | undefined => {
    try {
        return parse(fileText, {
            sourceType: 'module',
            plugins: [
                'jsx',
                'flow',
                'doExpressions',
                'objectRestSpread',
                'decorators',
                'classProperties',
                'exportExtensions',
                'asyncGenerators',
                'functionBind',
                'functionSent',
                'dynamicImport'
            ]
        });
    } catch (error) {
        return undefined;
    }
};

export const sourceLocationToRange = (sourceLocation: SourceLocation): Range => {
    return new Range(
        new Position(sourceLocation.start.line - 1, sourceLocation.start.column),
        new Position(sourceLocation.end.line - 1, sourceLocation.end.column)
    );
};

const PRETTIER_OPTIONS: prettier.Options = {
    tabWidth: 4,
    semi: false,
    printWidth: 40
};

export const formatJSString = (jsString: string): string => {
    return prettier.format(jsString, PRETTIER_OPTIONS);
};

export const isRequiredPropType = (propType: string): boolean => {
    const propTypeSeparatedByDot = propType.split('.');

    return propTypeSeparatedByDot[propTypeSeparatedByDot.length - 1] === 'isRequired';
};

export const getDefinition = async (
    documentUri: Uri,
    position: Position
): Promise<Location | undefined> => {
    const definitions = <{}[]>await commands.executeCommand(
        'vscode.executeTypeDefinitionProvider',
        documentUri,
        position
    );

    if (!definitions.length) {
        return undefined;
    }

    return <Location>definitions[0];
};

export const isReactComponent = (nameOfJsxTag: string): boolean =>
    nameOfJsxTag[0] === nameOfJsxTag[0].toUpperCase();

export const isPathToTypingFile = (path: string): boolean => basename(path).includes('.d.ts');

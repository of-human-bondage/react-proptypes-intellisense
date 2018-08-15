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

const isPathToTypingFile = (path: string): boolean => basename(path).endsWith('.d.ts');

export const getDefinition = async (
    documentUri: Uri,
    position: Position
): Promise<Location | undefined> => {
    const definitions = <Location[]>await commands.executeCommand(
        'vscode.executeImplementationProvider',
        documentUri,
        position
    );

    const definitionsWithoutTypings = definitions.filter(
        (definition: Location) => !isPathToTypingFile(definition.uri.path)
    );

    const length = definitionsWithoutTypings.length;

    if (!length) {
        return undefined;
    }

    return definitionsWithoutTypings[length - 1];
};

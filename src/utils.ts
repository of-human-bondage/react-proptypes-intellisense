import { File, SourceLocation } from 'babel-types';
import { parse } from 'babylon';
import { Range, Position } from 'vscode';
import * as prettier from 'prettier';

export const getAst = (fileText: string): File => {
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
};

export const sourceLocationToRange = (sourceLocation: SourceLocation): Range => {
    return new Range(
        new Position(sourceLocation.start.line - 1, sourceLocation.start.column),
        new Position(sourceLocation.end.line - 1, sourceLocation.end.column)
    );
};

const PRETTIER_OPTIONS: prettier.Options = {
    tabWidth: 4,
    semi: false
};

export const formatJSString = (jsString: string): string => {
    return prettier.format(jsString, PRETTIER_OPTIONS);
};

export const isRequiredPropType = (propType: string): boolean => {
    const propTypeSeparatedByDot = propType.split('.');

    if (propTypeSeparatedByDot[propTypeSeparatedByDot.length - 1] === 'isRequired') {
        return true;
    }

    return false;
};

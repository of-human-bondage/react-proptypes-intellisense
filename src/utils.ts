import { File, SourceLocation } from 'babel-types';
import { parse } from 'babylon';
import { Range, Position } from 'vscode';

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

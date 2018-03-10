import * as path from 'path';
import * as fs from 'fs';
import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemKind
} from 'vscode';
import { parse } from 'babylon';
import {
    Node,
    ImportDeclaration,
    File,
    ClassDeclaration,
    Identifier,
    ClassProperty
} from 'babel-types';
import babelTraverse from 'babel-traverse';

const START_TAG_CHARACTER = '<';
const END_TAG_CHARACTER = '>';

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
    private getJsxTagFromCursorPosition(document: TextDocument, position: Position): string {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);
        let startTagPosition = cursorPosition;
        let endTagPosition = cursorPosition;

        for (let i = startTagPosition; i > 0; i--) {
            if (documentText[i] === START_TAG_CHARACTER) {
                startTagPosition = i;

                break;
            }
        }

        for (let i = endTagPosition; i < documentText.length; i++) {
            if (documentText[i] === END_TAG_CHARACTER || documentText[i] === START_TAG_CHARACTER) {
                endTagPosition = i;

                break;
            }
        }

        return documentText.slice(startTagPosition, endTagPosition + 1).replace(/\s{2,}/g, ' ');
    }

    private getPropTypesFromJsxTag(jsxTag: string): string[] {
        /* 
            this method may return not only proptypes
            but also some other keywords that any jsx tag tag may contain
        */
        const regex = /[^\s]*=/g;
        let parsedPropTypesWithEqualsSigns: RegExpMatchArray = jsxTag.match(regex) || [];

        return parsedPropTypesWithEqualsSigns!.map(parsedPropType => {
            return parsedPropType.replace('=', '');
        });
    }

    private isReactComponent(nameOfJsxTag: string): boolean {
        return nameOfJsxTag[0] === nameOfJsxTag[0].toUpperCase();
    }

    private getFileContentByPath(filePath: string): string {
        return fs.readFileSync(filePath, 'utf-8');
    }

    private getAst(fileText: string): File {
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
    }

    private getPathFromImportDeclarationsByName(
        documentText: string,
        name: string
    ): string | undefined {
        const ast = this.getAst(documentText);

        let importDeclaration: ImportDeclaration | undefined;

        babelTraverse(ast, {
            ImportDefaultSpecifier(path) {
                if (path.node.local.name === name) {
                    importDeclaration = <ImportDeclaration>path.parent;
                }
            }
        });

        if (!importDeclaration) {
            return undefined;
        }

        return importDeclaration.source.value;
    }

    private getNameOfJsxTag(jsxTag: string): string {
        return jsxTag.slice(1).split(' ')[0];
    }

    private getPathOfComponent(componentName: string, document: TextDocument): string | undefined {
        const documentText = document.getText();

        let componentPath = this.getPathFromImportDeclarationsByName(documentText, componentName);
        if (!componentPath) {
            return undefined;
        }
        // TODO: add jsconfig.json tsconfig.json
        // FIXME: component may be in *.js file
        return path.join(path.dirname(document.uri.fsPath), componentPath + '.jsx');
    }

    private getComponentPropTypes(
        componentName: string,
        ast: File,
        alreadyProvidedProps: string[]
    ): string[] {
        let component: ClassDeclaration | undefined;
        let scope;
        let propTypes: ClassProperty | undefined;

        let result: string[] = [];

        babelTraverse(ast, {
            ClassDeclaration(path) {
                if (path.node.id.name === componentName) {
                    component = path.node;
                    scope = path.scope;
                }
            }
        });

        if (!component) {
            return [];
        }

        babelTraverse(
            component,
            {
                ClassProperty(path) {
                    if (path.node.key.name === 'propTypes') {
                        propTypes = path.node;
                    }
                }
            },
            scope
        );

        if (!propTypes) {
            return [];
        }

        babelTraverse(
            propTypes,
            {
                ObjectProperty(path) {
                    const objectPropertyKey = <Identifier>path.node.key;

                    // without inner property
                    if (
                        path.parent === propTypes!.value &&
                        alreadyProvidedProps.indexOf(objectPropertyKey.name) < 0
                    ) {
                        result.push(objectPropertyKey.name);
                    }
                }
            },
            scope
        );

        return result;
    }

    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): CompletionItem[] {
        const jsxTag = this.getJsxTagFromCursorPosition(document, position);
        const nameOfSelectedJsxTag = this.getNameOfJsxTag(jsxTag);

        const isReactComponent = this.isReactComponent(nameOfSelectedJsxTag);
        if (!isReactComponent) {
            return [];
        }

        const pathOfSelectedComponent = this.getPathOfComponent(nameOfSelectedJsxTag, document);
        if (!pathOfSelectedComponent) {
            return [];
        }

        const componentFileContent = this.getFileContentByPath(pathOfSelectedComponent);

        const ast = this.getAst(componentFileContent);

        const parsedPropTypes = this.getPropTypesFromJsxTag(jsxTag);

        // TODO: remove map method, make more beautiful
        return this.getComponentPropTypes(nameOfSelectedJsxTag, ast, parsedPropTypes).map(
            propType => {
                return new CompletionItem(propType, CompletionItemKind.Property);
            }
        );
    }
}

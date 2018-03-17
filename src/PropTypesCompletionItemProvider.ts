import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    CompletionItem,
    CompletionItemKind,
    commands,
    Location,
    Uri,
    workspace
} from 'vscode';
import { parse } from 'babylon';
import { File, ClassDeclaration, Identifier, ClassProperty } from 'babel-types';
import babelTraverse from 'babel-traverse';

const START_TAG_CHARACTER = '<';
const END_TAG_CHARACTER = '>';

export default class PropTypesCompletionItemProvider implements CompletionItemProvider {
    private getPropTypesFromJsxTag(jsxTag: string): string[] {
        /*
            this method may return not only proptypes
            but also some other keywords that any jsx tag may contain
        */
        const props = jsxTag.split(' ').slice(1);

        return props.map(prop => {
            const indexOfEqualSign = prop.indexOf('=');

            if (indexOfEqualSign === -1) {
                return prop;
            }

            return prop.slice(0, indexOfEqualSign);
        });
    }

    private isReactComponent(nameOfJsxTag: string): boolean {
        return nameOfJsxTag[0] === nameOfJsxTag[0].toUpperCase();
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

    private getNameOfJsxTag(jsxTag: string): string {
        return jsxTag.split(' ')[0];
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

    private getStartTagPosition(document: TextDocument, position: Position): Position | undefined {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);

        for (let i = cursorPosition; i > 0; i--) {
            if (documentText[i] === START_TAG_CHARACTER) {
                return document.positionAt(i + 1);
            }
        }
    }

    private getEndTagPosition(document: TextDocument, position: Position): Position {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);

        for (let i = cursorPosition; i > 0; i++) {
            if (documentText[i] === END_TAG_CHARACTER || documentText[i] === START_TAG_CHARACTER) {
                if (documentText[i - 1] === '/') {
                    return document.positionAt(i - 2);
                }

                return document.positionAt(i - 1);
            }
        }

        return position;
    }

    private getJsxTag(
        document: TextDocument,
        startPosition: Position,
        endPosition: Position
    ): string {
        const documentText = document.getText();
        const start = document.offsetAt(startPosition);
        const end = document.offsetAt(endPosition);

        return documentText.slice(start, end + 1).replace(/\s{2,}/g, ' ');
    }

    private async getDefinition(
        documentUri: Uri,
        position: Position
    ): Promise<Location | undefined> {
        const definitions = <{}[]>await commands.executeCommand(
            'vscode.executeDefinitionProvider',
            documentUri,
            position
        );

        if (!definitions.length) {
            return undefined;
        }

        return <Location>definitions[0];
    }

    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): Promise<CompletionItem[]> {
        const startTagPosition = this.getStartTagPosition(document, position);
        if (!startTagPosition) {
            return [];
        }

        const endTagPosition = this.getEndTagPosition(document, position);
        const jsxTag = this.getJsxTag(document, startTagPosition, endTagPosition);
        const nameOfJsxTag = this.getNameOfJsxTag(jsxTag);

        const isReactComponent = this.isReactComponent(nameOfJsxTag);
        if (!isReactComponent) {
            return [];
        }

        const tagDefinition = await this.getDefinition(document.uri, startTagPosition);
        if (!tagDefinition) {
            return [];
        }

        const componentTextDocument = await workspace.openTextDocument(tagDefinition.uri);
        const componentName = componentTextDocument.getText(tagDefinition.range);

        const ast = this.getAst(componentTextDocument.getText());

        const parsedPropTypes = this.getPropTypesFromJsxTag(jsxTag);

        // TODO: remove map method, make more beautiful
        return this.getComponentPropTypes(componentName, ast, parsedPropTypes).map(propType => {
            return new CompletionItem(propType, CompletionItemKind.Property);
        });
    }
}

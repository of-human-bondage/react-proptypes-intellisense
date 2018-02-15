import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    CompletionItem
} from "vscode";

export default class PropTypesCompletionItemProvider
    implements CompletionItemProvider {
    constructor() { }

    private getJsxTag(documentText: string, cursorPosition: number): string {
        let startTagPosition = cursorPosition;
        let endTagPosition = cursorPosition;

        for (let i = startTagPosition; i > 0; i--) {
            if (documentText[i] === "<") {
                startTagPosition = i;

                break;
            }
        }

        for (let i = endTagPosition; i < documentText.length; i++) {
            if (documentText[i] === ">") {
                endTagPosition = i;

                break;
            }
        }

        return documentText.slice(startTagPosition, endTagPosition + 1);
    }

    public provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): CompletionItem[] {
        const documentText = document.getText();
        const cursorPosition = document.offsetAt(position);
        const jsxTag = this.getJsxTag(documentText, cursorPosition)

        return [];
    }
}

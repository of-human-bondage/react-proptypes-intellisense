//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

//import { activate } from '../src/extension';
import * as vscode from 'vscode';
import { completionItemsEquals, pathEquals } from './utils';
import * as path from 'path';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

const checkCompletionItemsForSpecificPosition = (
    cursorPositionForComponent: vscode.Position,
    proposals: Array<vscode.CompletionItem>,
    itemsShouldExist: boolean = true
) => {
    const workspace = vscode.workspace;

    const workspaceFolders = workspace!.workspaceFolders;
    assert.ok(workspaceFolders!.length > 0);
    const workspaceFolder = workspaceFolders![0];
    assert.ok(pathEquals(workspaceFolder.uri.fsPath, path.join(__dirname, '../../testWorkspace')));
    const indexJsxPath = path.join(workspaceFolder.uri.fsPath, './index.jsx');
    const indexJsxUriPath = vscode.Uri.file(indexJsxPath);

    return workspace
        .openTextDocument(indexJsxPath)
        .then(vscode.window.showTextDocument)
        .then(document => {
            return vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                indexJsxUriPath,
                cursorPositionForComponent
            );
        })
        .then((result: vscode.CompletionList | undefined) => {
            proposals.forEach(elem => {
                const ifCompletionItemWasPresent = result!.items.find(
                    (item: vscode.CompletionItem, index: number) => {
                        return completionItemsEquals(elem, item);
                    }
                );
                if (itemsShouldExist) {
                    assert.notEqual(
                        ifCompletionItemWasPresent,
                        undefined,
                        'Completion item ' + elem.label + ' was not present'
                    );
                } else {
                    assert.equal(
                        ifCompletionItemWasPresent,
                        undefined,
                        'Completion item ' + elem.label + ' was present'
                    );
                }
            });
        });
};

suite('Extension', () => {
    suiteSetup(done => {
        const componentNamePosition = new vscode.Position(18, 17);
        const workspace = vscode.workspace;
        const workspaceFolders = workspace!.workspaceFolders;
        assert.ok(workspaceFolders!.length > 0);
        const workspaceFolder = workspaceFolders![0];
        assert.ok(
            pathEquals(workspaceFolder.uri.fsPath, path.join(__dirname, '../../testWorkspace'))
        );
        const indexJsxPath = path.join(workspaceFolder.uri.fsPath, './index.jsx');
        const indexJsxUriPath = vscode.Uri.file(indexJsxPath);
        const waitForDefinitions = (done: () => void) => {
            vscode.commands
                .executeCommand(
                    'vscode.executeDefinitionProvider',
                    indexJsxUriPath,
                    componentNamePosition
                )
                .then((definitions: any) => {
                    if (!definitions || !definitions.length) {
                        console.log('Wait until definitions could be read');
                        waitForDefinitions(done);
                    } else {
                        done();
                    }
                });
        };
        workspace
            .openTextDocument(indexJsxPath)
            .then(vscode.window.showTextDocument)
            .then(() => {
                waitForDefinitions(done);
            });
    });

    let boolCompletionItem = new vscode.CompletionItem(
        'boolProp?',
        vscode.CompletionItemKind.Field
    );
    boolCompletionItem.detail = 'PropTypes.bool';
    boolCompletionItem.insertText = 'boolProp';

    let funcCompletionItem = new vscode.CompletionItem(
        'funcProp?',
        vscode.CompletionItemKind.Field
    );
    funcCompletionItem.detail = 'PropTypes.func';
    funcCompletionItem.insertText = 'funcProp';

    let objCompletionItem = new vscode.CompletionItem(
        'objectProp?',
        vscode.CompletionItemKind.Field
    );
    objCompletionItem.detail = 'PropTypes.object';
    objCompletionItem.insertText = 'objectProp';

    const proposal = [boolCompletionItem, funcCompletionItem, objCompletionItem];
    test('Find props for an imported component', () => {
        const cursorPositionForComponent = new vscode.Position(18, 35);
        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, proposal);
    });
    test('Find props for an imported component with static propTypes', () => {
        const cursorPositionForComponent = new vscode.Position(19, 46);
        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, proposal);
    });
    test(
        'Find props for an imported component with static propTypes ' +
            'that already has some props',
        () => {
            const cursorPositionForComponent = new vscode.Position(21, 20);
            const proposalWithoutBoolItem: vscode.CompletionItem[] = proposal.filter(item => {
                return item.label !== 'boolProp?' && item.label !== 'funcProp?';
            });
            return checkCompletionItemsForSpecificPosition(
                cursorPositionForComponent,
                proposalWithoutBoolItem
            );
        }
    );
    test(
        'Find props for an imported component with static propTypes ' +
            'that already has all props',
        () => {
            const cursorPositionForComponent = new vscode.Position(33, 20);
            return checkCompletionItemsForSpecificPosition(
                cursorPositionForComponent,
                proposal,
                false
            );
        }
    );
    test('Find props for a component with propTypes inside the prototype', () => {
        const cursorPositionForComponent = new vscode.Position(35, 47);
        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, proposal);
    });

    test('Find props for an imported component without propTypes', () => {
        const cursorPositionForComponent = new vscode.Position(37, 39);

        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, []);
    });

    test(
        'Find props for a component in the same document with a component ' +
            'where the suggestion was triggered from. It has a required prop',
        () => {
            const proposal = new vscode.CompletionItem('boolProp', vscode.CompletionItemKind.Field);
            proposal.detail = 'PropTypes.bool.isRequired';
            proposal.insertText = 'boolProp';

            const cursorPositionForComponent = new vscode.Position(36, 40);
            return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, [proposal]);
        }
    );

    test(
        'Find props for a component in the same document with a component ' +
            'where the suggestion was triggered from. It has a shape prop',
        () => {
            const proposal = new vscode.CompletionItem(
                'shapeProp',
                vscode.CompletionItemKind.Field
            );
            proposal.detail = 'PropTypes.shape(...).isRequired';
            proposal.insertText = 'shapeProp';

            const cursorPositionForComponent = new vscode.Position(36, 40);
            return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, [proposal]);
        }
    );

    test('Find props outside a component', () => {
        const cursorPositionForComponent = new vscode.Position(38, 16);

        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, []);
    });

    test('Find props for <div></div>', () => {
        const cursorPositionForComponent = new vscode.Position(11, 17);

        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, []);
    });

    test("Find props for isn't imported component", () => {
        const cursorPositionForComponent = new vscode.Position(38, 38);

        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, []);
    });

    test('Find props for a component inside component attribute', () => {
        const cursorPositionForComponent = new vscode.Position(23, 37);

        return checkCompletionItemsForSpecificPosition(cursorPositionForComponent, []);
    });
});

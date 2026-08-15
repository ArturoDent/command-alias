const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vscode = require('vscode');

// Unlike settingsExamples.test.js (which only checks that a "command
// aliases" setting produces the right {run, args} descriptor), these tests
// call vscode.commands.executeCommand(run, args) with that exact descriptor
// against a real open document and observe the actual editor effect - e.g.
// that "Select Whole Line" really does select the whole line. They call
// executeCommand directly rather than going through a registered alias
// command id, because registering an alias means writing the "command
// aliases" setting, which would make the running extension rewrite this
// repo's own package.json as a side effect - exactly the risk
// packageJSON.test.js guards against.
//
// Some examples (1, 6, 7, 12) only ever surface as Command Palette/picker
// UI with no stable public API to assert against, and example 11 depends
// on find-and-transform's "script:" feature needing its own separate
// configuration this repo doesn't own. Those are smoke-tested only: they
// confirm the command resolves without throwing, not a specific effect.

/** @type {vscode.TextEditor} */
let editor;
/** @type {String} */
let tempFilePath;

/**
 * Load a scenario's input.js fixture into the shared editor and make sure
 * it (not whatever tab a previous test may have left active) has focus.
 *
 * @param {String} scenario
 */
async function loadFixture(scenario) {
  const content = fs.readFileSync(path.join(__dirname, 'settingsExamplesBehavior', scenario, 'input.txt'), 'utf8');
  editor = await vscode.window.showTextDocument(editor.document);
  const fullRange = new vscode.Range(0, 0, editor.document.lineCount, 0);
  await editor.edit(editBuilder => editBuilder.replace(fullRange, content));
}

/**
 * Poll a condition until it's true or the timeout elapses, for effects
 * (multi-step commands, extension host round-trips) that don't settle
 * synchronously within the executeCommand() call that triggered them.
 *
 * @param {() => Boolean} predicate
 * @param {{timeout?: Number, interval?: Number}} [options]
 */
async function waitFor(predicate, { timeout = 4000, interval = 50 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timed out waiting for condition');
}

suite('Settings_examples.md: behavioral (commands run against a real document)', () => {

  suiteSetup(async function () {
    this.timeout(20000);
    tempFilePath = path.join(os.tmpdir(), `command-alias-behavior-test-${ Date.now() }.js`);
    fs.writeFileSync(tempFilePath, '');
    const doc = await vscode.workspace.openTextDocument(tempFilePath);
    editor = await vscode.window.showTextDocument(doc);
  });

  suiteTeardown(async function () {
    this.timeout(10000);
    await vscode.window.showTextDocument(editor.document);
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    fs.unlinkSync(tempFilePath);
  });

  test('2. workbench.action.terminal.renameWithArg: renames the active terminal', async () => {
    const terminal = vscode.window.createTerminal('temp');
    terminal.show();
    await waitFor(() => vscode.window.activeTerminal === terminal);

    await vscode.commands.executeCommand('workbench.action.terminal.renameWithArg', { name: 'remote' });
    await waitFor(() => !!vscode.window.activeTerminal && vscode.window.activeTerminal.name === 'remote');

    assert.strictEqual(vscode.window.activeTerminal && vscode.window.activeTerminal.name, 'remote');
    terminal.dispose();
  });

  test('3. extension.multiCommand.execute: "Select Whole Line" selects the whole line', async () => {
    await loadFixture('selectWholeLine');
    editor.selection = new vscode.Selection(0, 10, 0, 10);

    await vscode.commands.executeCommand('extension.multiCommand.execute', {
      sequence: [
        { command: 'jump-and-select.jumpBackward', args: { text: '^', putCursorBackward: 'afterCharacter', restrictSearch: 'line' } },
        { command: 'jump-and-select.jumpForwardSelect', args: { text: '$', putCursorForward: 'beforeCharacter', restrictSearch: 'line' } }
      ]
    });

    await waitFor(() => editor.document.getText(editor.selection) === "const hello = 'world';");
    assert.strictEqual(editor.document.getText(editor.selection), "const hello = 'world';");
  });

  test('4. findInCurrentFile: uppercases the matched text', async () => {
    await loadFixture('uppercaseMatchedText');

    await vscode.commands.executeCommand('findInCurrentFile', {
      find: '(matched)',
      replace: '${1:+\\U$1}',
      isRegex: true
    });

    await waitFor(() => editor.document.getText().includes('MATCHED'));
    assert.strictEqual(editor.document.getText(), 'this word is MATCHED here');
  });

  test('5. findInCurrentFile: inserts a console.log referencing the clipboard', async () => {
    await loadFixture('consoleLogClipboard');
    const savedClipboard = await vscode.env.clipboard.readText();

    try {
      editor.selection = new vscode.Selection(0, 6, 0, 11); // selects "myVar"
      await vscode.commands.executeCommand('findInCurrentFile', {
        preCommands: [
          'editor.action.clipboardCopyAction',
          'editor.action.insertLineAfter'
        ],
        replace: 'console.log ("${CLIPBOARD}", ${CLIPBOARD});',
        restrictFind: 'line'
      });

      await waitFor(() => editor.document.lineCount > 1 && editor.document.lineAt(1).text.includes('console.log'));
      assert.strictEqual(editor.document.lineAt(1).text, 'console.log ("myVar", myVar);');
    } finally {
      await vscode.env.clipboard.writeText(savedClipboard);
    }
  });

  test('8. runCommands: types a label then inserts a timestamp', async () => {
    await loadFixture('insertLabelAndTimestamp');
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await vscode.commands.executeCommand('runCommands', {
      commands: [
        { command: 'type', args: { text: 'myText goes here:  ' } },
        'insert-last-modified-time.insertTimeCursor'
      ]
    });

    await waitFor(() => editor.document.getText().length > 'myText goes here:  '.length);
    const text = editor.document.getText();
    assert.ok(text.startsWith('myText goes here:  '), `expected text to start with the typed label, got: ${ text }`);
    assert.ok(text.length > 'myText goes here:  '.length, 'expected a timestamp to be appended after the label');
  });

  test('9. runCommands: selects the parenthesized text, parens included', async () => {
    await loadFixture('selectBetweenParens');
    editor.selection = new vscode.Selection(0, 4, 0, 4); // cursor between '(' and 'bar'

    await vscode.commands.executeCommand('runCommands', {
      commands: [
        {
          command: 'jump-and-select.jumpBackwardSelect',
          args: { text: '(', putCursorBackwardSelect: 'afterCharacter' }
        },
        {
          command: 'jump-and-select.jumpForwardSelect',
          args: { text: ')', putCursorForwardSelect: 'beforeCharacter' }
        }
      ]
    });

    // Verified against the real jump-and-select extension: this combination
    // selects the parens themselves too, not just their contents.
    await waitFor(() => editor.document.getText(editor.selection).includes('bar'));
    assert.strictEqual(editor.document.getText(editor.selection), '(bar)');
  });

  test('10. editor.action.insertSnippet: converts a selection to kebab-case', async () => {
    await loadFixture('kebabCaseSnippet');
    editor.selection = new vscode.Selection(0, 0, 0, 6); // selects "FooBar"

    await vscode.commands.executeCommand('editor.action.insertSnippet', {
      snippet: '${TM_SELECTED_TEXT/([A-Z][a-z0-9_]+)/-${1:/downcase}/g}'
    });

    await waitFor(() => editor.document.getText() === '-foo-bar');
    assert.strictEqual(editor.document.getText(), '-foo-bar');
  });

  test('13. jump-and-select.bySymbol: jumps to the next method', async () => {
    await loadFixture('nextMethod');
    editor.selection = new vscode.Selection(1, 2, 1, 2); // inside method1

    await vscode.commands.executeCommand('jump-and-select.bySymbol', {
      symbols: 'method',
      where: 'nextStart',
      select: true
    });

    await waitFor(() => editor.selection.active.line === 4);
    assert.strictEqual(editor.selection.active.line, 4, "expected the cursor to land on method2's line");
  });

  test('14. jump-and-select.jumpForwardSelect: selects to the next blank line', async () => {
    await loadFixture('selectToNextBlankLine');
    editor.selection = new vscode.Selection(0, 0, 0, 0);

    await vscode.commands.executeCommand('jump-and-select.jumpForwardSelect', {
      text: '^\\s*?$',
      isRegex: true,
      select: 'match',
      putCursorOnForwardSelect: 'afterCharacter'
    });

    await waitFor(() => editor.selection.start.line === 2);
    assert.strictEqual(editor.selection.start.line, 2, 'expected the selection to land on the blank line');
  });

  test('1. search.action.openNewEditor: resolves without throwing (search-editor UI, not asserted)', async () => {
    await vscode.commands.executeCommand('search.action.openNewEditor', {
      query: 'CN=([^,]*)',
      isRegexp: true,
      includes: '${relativeFile}',
      showIncludesExcludes: true,
      triggerSearch: true,
      contextLines: 2
    });
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('6. workbench.action.findInFiles: resolves without throwing (search sidebar UI, not asserted)', async () => {
    await vscode.commands.executeCommand('workbench.action.findInFiles', {
      query: '${selectedText}',
      filesToInclude: 'src, include'
    });
    await vscode.commands.executeCommand('workbench.action.closeSidebar');
  });

  test('7. workbench.action.quickOpen: resolves without throwing (quick pick UI, not asserted)', async () => {
    await vscode.commands.executeCommand('workbench.action.quickOpen', '@:');
    await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
  });

  test('11. findInCurrentFile: script-based replace resolves without throwing (depends on unowned find-and-transform script config, not asserted)', async () => {
    await loadFixture('uppercaseMatchedText');
    await vscode.commands.executeCommand('findInCurrentFile', {
      description: '',
      preCommands: 'cursorHomeSelect',
      find: '(\\$1) (\\d+)',
      isRegex: true,
      replace: ['$${script:math_with_numbers}$$'],
      restrictFind: 'line'
    });
  });

  test('12. editor.actions.findWithArgs: resolves without throwing (find widget UI, not asserted)', async () => {
    await loadFixture('selectWholeLine');
    await vscode.commands.executeCommand('editor.actions.findWithArgs', {
      isRegex: true,
      searchString: '^${selectedText}(?:(?=\\w))'
    });
    await vscode.commands.executeCommand('closeFindWidget');
  });
});

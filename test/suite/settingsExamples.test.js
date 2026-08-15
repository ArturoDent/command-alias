const assert = require('assert');
const settingsJS = require('../../src/settings.js');

// Each test's "settings" object is the "command aliases" value from the
// matching numbered example in Settings_examples.md; the assertion is
// the package.json-style command that makePackageCommandsFromSettings
// should produce for it. Keeping these in sync with Settings_examples.md
// means an edit to one that breaks the other shows up as a test failure.

const CATEGORY = 'Alias';

/**
 * Run makePackageCommandsFromSettings and drop the always-present
 * 'command-alias.createAliases' entry, leaving just the alias(es) under
 * test.
 *
 * @param {Object} commandAliases - a "command aliases" settings.json value
 * @returns {Array<*>}
 */
function aliasCommands(commandAliases) {
  const settings = Object.entries(commandAliases);
  const commands = settingsJS.makePackageCommandsFromSettings(settings, CATEGORY);
  return commands.filter(command => command.command !== 'command-alias.createAliases');
}

suite('Settings_examples.md', () => {

  test('1. Plain object args, no when', () => {
    const [command] = aliasCommands({
      "search.action.openNewEditor": {
        "Search CN= in File": {
          "query": "CN=([^,]*)",
          "isRegexp": true,
          "includes": "${relativeFile}",
          "showIncludesExcludes": true,
          "triggerSearch": true,
          "contextLines": 2
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Search_CN=_in_File",
      run: "search.action.openNewEditor",
      title: "Search CN= in File",
      category: CATEGORY,
      args: {
        query: "CN=([^,]*)",
        isRegexp: true,
        includes: "${relativeFile}",
        showIncludesExcludes: true,
        triggerSearch: true,
        contextLines: 2
      }
    });
  });

  test('2. Simple single-field args', () => {
    const [command] = aliasCommands({
      "workbench.action.terminal.renameWithArg": {
        "Rename Terminal to Remote": {
          "name": "remote"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Rename_Terminal_to_Remote",
      run: "workbench.action.terminal.renameWithArg",
      title: "Rename Terminal to Remote",
      category: CATEGORY,
      args: {name: "remote"}
    });
  });

  test('3. A third-party multi-command extension (args passed through untouched)', () => {
    const [command] = aliasCommands({
      "extension.multiCommand.execute": {
        "Select Whole Line": {
          "sequence": [
            {
              "command": "jump-and-select.jumpBackward",
              "args": {"text": "^", "putCursorBackward": "afterCharacter", "restrictSearch": "line"}
            },
            {
              "command": "jump-and-select.jumpForwardSelect",
              "args": {"text": "$", "putCursorForward": "beforeCharacter", "restrictSearch": "line"}
            }
          ]
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Select_Whole_Line",
      run: "extension.multiCommand.execute",
      title: "Select Whole Line",
      category: CATEGORY,
      args: {
        sequence: [
          {
            command: "jump-and-select.jumpBackward",
            args: {text: "^", putCursorBackward: "afterCharacter", restrictSearch: "line"}
          },
          {
            command: "jump-and-select.jumpForwardSelect",
            args: {text: "$", putCursorForward: "beforeCharacter", restrictSearch: "line"}
          }
        ]
      }
    });
  });

  test('4 & 5. Multiple aliases for the same base command', () => {
    const [uppercase, consoleLog] = aliasCommands({
      "findInCurrentFile": {
        "Uppercase Matched Text": {
          "find": "(matched)",
          "replace": "${1:+\\U$1}",
          "isRegex": true
        },
        "Console.log Clipboard": {
          "preCommands": [
            "editor.action.clipboardCopyAction",
            "editor.action.insertLineAfter"
          ],
          "replace": "console.log (\"${CLIPBOARD}\", ${CLIPBOARD});",
          "restrictFind": "line"
        }
      }
    });

    assert.deepStrictEqual(uppercase, {
      command: "Uppercase_Matched_Text",
      run: "findInCurrentFile",
      title: "Uppercase Matched Text",
      category: CATEGORY,
      args: {
        find: "(matched)",
        replace: "${1:+\\U$1}",
        isRegex: true
      }
    });

    assert.deepStrictEqual(consoleLog, {
      command: "Console.log_Clipboard",
      run: "findInCurrentFile",
      title: "Console.log Clipboard",
      category: CATEGORY,
      args: {
        preCommands: [
          "editor.action.clipboardCopyAction",
          "editor.action.insertLineAfter"
        ],
        replace: "console.log (\"${CLIPBOARD}\", ${CLIPBOARD});",
        restrictFind: "line"
      }
    });
  });

  test('6. Args using an editor variable', () => {
    const [command] = aliasCommands({
      "workbench.action.findInFiles": {
        "Find Selection in src/include": {
          "query": "${selectedText}",
          "filesToInclude": "src, include"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Find_Selection_in_src/include",
      run: "workbench.action.findInFiles",
      title: "Find Selection in src/include",
      category: CATEGORY,
      args: {
        query: "${selectedText}",
        filesToInclude: "src, include"
      }
    });
  });

  test('7. A bare (non-object) args value', () => {
    const [command] = aliasCommands({
      "workbench.action.quickOpen": {
        "Quick Open Symbols": {
          "args": "@:"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Quick_Open_Symbols",
      run: "workbench.action.quickOpen",
      title: "Quick Open Symbols",
      category: CATEGORY,
      args: "@:"
    });
  });

  test('8 & 9. runCommands with the shorthand step form and a when clause', () => {
    const [insertLabel, selectBetween] = aliasCommands({
      "runCommands": {
        "Insert Label and Timestamp": {
          "commands": [
            {"type": {"text": "myText goes here:  "}},
            "insert-last-modified-time.insertTimeCursor"
          ]
        },
        "Select Between Parens": {
          "commands": [
            {
              "command": "jump-and-select.jumpBackwardSelect",
              "args": {"text": "(", "putCursorBackwardSelect": "afterCharacter"}
            },
            {
              "command": "jump-and-select.jumpForwardSelect",
              "args": {"text": ")", "putCursorForwardSelect": "beforeCharacter"}
            }
          ],
          "when": "editorTextFocus && !editorReadonly && editorLangId == rust"
        }
      }
    });

    assert.deepStrictEqual(insertLabel, {
      command: "Insert_Label_and_Timestamp",
      run: "runCommands",
      title: "Insert Label and Timestamp",
      category: CATEGORY,
      args: {
        commands: [
          {command: "type", args: {text: "myText goes here:  "}},
          "insert-last-modified-time.insertTimeCursor"
        ]
      }
    });

    assert.deepStrictEqual(selectBetween, {
      command: "Select_Between_Parens",
      run: "runCommands",
      title: "Select Between Parens",
      category: CATEGORY,
      enablement: "editorTextFocus && !editorReadonly && editorLangId == rust",
      args: {
        commands: [
          {
            command: "jump-and-select.jumpBackwardSelect",
            args: {text: "(", putCursorBackwardSelect: "afterCharacter"}
          },
          {
            command: "jump-and-select.jumpForwardSelect",
            args: {text: ")", putCursorForwardSelect: "beforeCharacter"}
          }
        ]
      }
    });
  });

  test('10. A when clause outside runCommands', () => {
    const [command] = aliasCommands({
      "editor.action.insertSnippet": {
        "Convert Selections to kebab-case": {
          "snippet": "${TM_SELECTED_TEXT/([A-Z][a-z0-9_]+)/-${1:/downcase}/g}",
          "when": "editorHasMultipleSelections && textInputFocus"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Convert_Selections_to_kebab-case",
      run: "editor.action.insertSnippet",
      title: "Convert Selections to kebab-case",
      category: CATEGORY,
      enablement: "editorHasMultipleSelections && textInputFocus",
      args: {
        snippet: "${TM_SELECTED_TEXT/([A-Z][a-z0-9_]+)/-${1:/downcase}/g}"
      }
    });
  });

  test('11. Arbitrary args pass straight through', () => {
    const [command] = aliasCommands({
      "findInCurrentFile": {
        "Run Math Script on Line": {
          "description": "",
          "preCommands": "cursorHomeSelect",
          "find": "(\\$1) (\\d+)",
          "isRegex": true,
          "replace": [
            "$${script:math_with_numbers}$$"
          ],
          "restrictFind": "line"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Run_Math_Script_on_Line",
      run: "findInCurrentFile",
      title: "Run Math Script on Line",
      category: CATEGORY,
      args: {
        description: "",
        preCommands: "cursorHomeSelect",
        find: "(\\$1) (\\d+)",
        isRegex: true,
        replace: [
          "$${script:math_with_numbers}$$"
        ],
        restrictFind: "line"
      }
    });
  });

  test('12. editor.actions.findWithArgs', () => {
    const [command] = aliasCommands({
      "editor.actions.findWithArgs": {
        "Find Selected Text at Line Start": {
          "isRegex": true,
          "searchString": "^${selectedText}(?:(?=\\w))"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Find_Selected_Text_at_Line_Start",
      run: "editor.actions.findWithArgs",
      title: "Find Selected Text at Line Start",
      category: CATEGORY,
      args: {
        isRegex: true,
        searchString: "^${selectedText}(?:(?=\\w))"
      }
    });
  });

  test('13. A third-party extension command', () => {
    const [command] = aliasCommands({
      "jump-and-select.bySymbol": {
        "Next Method": {
          "symbols": "method",
          "where": "nextStart",
          "select": true
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Next_Method",
      run: "jump-and-select.bySymbol",
      title: "Next Method",
      category: CATEGORY,
      args: {
        symbols: "method",
        where: "nextStart",
        select: true
      }
    });
  });

  test('14. Another third-party extension command', () => {
    const [command] = aliasCommands({
      "jump-and-select.jumpForwardSelect": {
        "Select to Next Blank Line": {
          "text": "^\\s*?$",
          "isRegex": true,
          "select": "match",
          "putCursorOnForwardSelect": "afterCharacter"
        }
      }
    });

    assert.deepStrictEqual(command, {
      command: "Select_to_Next_Blank_Line",
      run: "jump-and-select.jumpForwardSelect",
      title: "Select to Next Blank Line",
      category: CATEGORY,
      args: {
        text: "^\\s*?$",
        isRegex: true,
        select: "match",
        putCursorOnForwardSelect: "afterCharacter"
      }
    });
  });
});

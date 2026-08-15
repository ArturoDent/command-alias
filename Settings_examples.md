# Settings Examples

This file shows real `keybindings.json`-style entries and the equivalent
`"command aliases"` entry you would add to your `settings.json` to turn
each one into a Command Palette alias. See [README.md](README.md) (the
`### Settings` section) for the full field reference: how `args` and
`when` work, the `commandAlias.category` setting, and how to give a
command multiple aliases.

## How to read these examples

Each example below has two blocks:

* **before (keybindings.json)** - a keybinding entry you might already
  have, or one you copied from a command's context menu with
  `Copy Command ID`.

* **after ("command aliases" in settings.json)** - what to add under
  `"command aliases"` in your `settings.json` so that same command/args
  combination shows up as a titled entry in the Command Palette.

After saving `settings.json` you will need to reload vscode before the new
alias appears - see README's `Requirements` section.

-----------------

## 1. Plain object args, no `when`

```jsonc
// before (keybindings.json)
{
  "key": "ctrl+shift+g",
  "command": "search.action.openNewEditor",
  "args": {                           // no args {} object in the setting
    "query": "CN=([^,]*)",
    "isRegexp": true,
    "includes": "${relativeFile}",
    "showIncludesExcludes": true,
    "triggerSearch": true,
    "contextLines": 2
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "search.action.openNewEditor": {
    "Search CN= in File": {   // your chosen "alias" as it will appear in the COmmand Palette
      "query": "CN=([^,]*)",
      "isRegexp": true,
      "includes": "${relativeFile}",
      "showIncludesExcludes": true,
      "triggerSearch": true,
      "contextLines": 2
    }
  }
}
```

-----------------

## 2. Simple single-field args

```jsonc
// before (keybindings.json)
{
  "key": "ctrl+t",
  "command": "workbench.action.terminal.renameWithArg",
  "args": {
    "name": "remote"
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "workbench.action.terminal.renameWithArg": {
    "Rename Terminal to Remote": {
      "name": "remote"
    }
  }
}
```

-----------------

## 3. A third-party multi-command extension

`extension.multiCommand.execute` is a different extension's own
multi-command mechanism, not vscode's built-in `runCommands`. Its
`sequence` array is passed through untouched by this extension. Compare this with example 8,
where the base command is `runCommands` and `command-alias` *does*
understand its `commands` array well enough to offer a shorthand.

```jsonc
// before (keybindings.json)
{
  "key": "alt+r",
  "command": "extension.multiCommand.execute",
  "args": {
    "sequence": [
      {
        "command": "jump-and-select.jumpBackward",
        "args": {
          "text": "^",
          "putCursorBackward": "afterCharacter",
          "restrictSearch": "line"
        }
      },
      {
        "command": "jump-and-select.jumpForwardSelect",
        "args": {
          "text": "$",
          "putCursorForward": "beforeCharacter",
          "restrictSearch": "line"
        }
      }
    ]
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "extension.multiCommand.execute": {
    "Select Whole Line": {
      "sequence": [
        {
          "command": "jump-and-select.jumpBackward",
          "args": {
            "text": "^",
            "putCursorBackward": "afterCharacter",
            "restrictSearch": "line"
          }
        },
        {
          "command": "jump-and-select.jumpForwardSelect",
          "args": {
            "text": "$",
            "putCursorForward": "beforeCharacter",
            "restrictSearch": "line"
          }
        }
      ]
    }
  }
}
```

-----------------

## 4 & 5. Multiple aliases for the same base command

Both of these keybindings target `findInCurrentFile` with different
`args`. Rather than repeating `"findInCurrentFile"` as a top-level key
twice (which vscode would flag as a duplicate JSON key), give it one
entry with two sibling alias titles.

```jsonc
// before (keybindings.json)
{
  "key": "alt+r",
  "command": "findInCurrentFile",
  "args": {
    "find": "(matched)",
    "replace": "${1:+\\U$1}",
    "isRegex": true
  }
}
```

```jsonc
{
  "key": "alt+i",
  "command": "findInCurrentFile",
  "args": {
    "preCommands": [
      "editor.action.clipboardCopyAction",
      "editor.action.insertLineAfter"
    ],
    "replace": "console.log (\"${CLIPBOARD}\", ${CLIPBOARD});",
    "restrictFind": "line"
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "findInCurrentFile": {
    "Uppercase Matched Text": {     // your given alias
      "find": "(matched)",
      "replace": "${1:+\\U$1}",
      "isRegex": true
    },
    "Console.log Clipboard": {      // your given alias
      "preCommands": [
        "editor.action.clipboardCopyAction",
        "editor.action.insertLineAfter"
      ],
      "replace": "console.log (\"${CLIPBOARD}\", ${CLIPBOARD});",
      "restrictFind": "line"
    }
  }
}
```

-----------------

## 6. Args using an editor variable

`${selectedText}` (and other vscode variables) are not processed by
`command-alias` - they are resolved by vscode itself and get
forwarded to whatever command runs, so they work exactly as they would in
a keybinding.

```jsonc
// before (keybindings.json)
{
  "key": "ctrl+shift+f",
  "command": "workbench.action.findInFiles",
  "args": {
    "query": "${selectedText}",
    "filesToInclude": "src, include"
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "workbench.action.findInFiles": {
    "Find Selection in src/include": {
      "query": "${selectedText}",
      "filesToInclude": "src, include"
    }
  }
}
```

-----------------

## 7. A bare (non-object) args value

Some commands, like `workbench.action.quickOpen` here, take a plain
string (or other non-object value) as `args` instead of an object. In that case, just keep it in its
explicit `"args"` key.

```jsonc
// before (keybindings.json)
{
  "key": "shift+alt+p",
  "command": "workbench.action.quickOpen",
  "args": "@:"
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "workbench.action.quickOpen": {
    "Quick Open Symbols": {
      "args": "@:"
    }
  }
}
```

-----------------

## 8 & 9. `runCommands` with the shorthand step form

`runCommands`' own `commands` array normally requires each step to be a
string or a verbose `{command, args}` object. `command-alias` also
accepts a shorthand step, `{ "commandId": {args} }`, which gets expanded
for you. Example 9 is given a real `when` clause (adapted from the
commented-out option in the original keybinding) to show `when` mapping
to the alias's Command Palette visibility, alongside example 8 as a
sibling alias with no `when`.

```jsonc
// before (keybindings.json)
{
  "key": "alt+t",
  "command": "runCommands",
  "args": {
    "commands": [
      {
        "command": "type",
        "args": {
          "text": "myText goes here:  "
        }
      },
      "insert-last-modified-time.insertTimeCursor"
    ]
  }
}
```

```jsonc
{
  "key": "alt+t",
  "command": "runCommands",
  "args": {
    "commands": [
      {
        "command": "jump-and-select.jumpBackwardSelect",
        "args": {
          "text": "(",
          "putCursorBackwardSelect": "afterCharacter"
        }
      },
      {
        "command": "jump-and-select.jumpForwardSelect",
        "args": {
          "text": ")",
          "putCursorForwardSelect": "beforeCharacter"
        }
      }
    ]
  },
  "when": "editorTextFocus && !editorReadonly && editorLangId == rust"
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "runCommands": {
    "Insert Label and Timestamp": {
      "commands": [
        { "type": 
          { 
            "text": "myText goes here:  "
          } 
        },
        "insert-last-modified-time.insertTimeCursor"
      ]
    },
    "Select Between Parens": {
      "commands": [
        {
          "command": "jump-and-select.jumpBackwardSelect",
          "args": {
            "text": "(",
            "putCursorBackward": "afterCharacter"
          }
        },
        {
          "command": "jump-and-select.jumpForwardSelect",
          "args": {
            "text": ")",
            "putCursorBackward": "beforeCharacter"
          }
        }
      ],
      "when": "editorTextFocus && !editorReadonly && editorLangId == rust"
    }
  }
}
```

-----------------

## 10. A `when` clause outside `runCommands`

`when` works on any alias, not just `runCommands` ones.

```jsonc
// before (keybindings.json)
{
  "key": "alt+i",
  "command": "editor.action.insertSnippet",
  "args": {
    "snippet": "${TM_SELECTED_TEXT/([A-Z][a-z0-9_]+)/-${1:/downcase}/g}"
  },
  "when": "editorHasMultipleSelections && textInputFocus"
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "editor.action.insertSnippet": {
    "Convert Selections to kebab-case": {
      "snippet": "${TM_SELECTED_TEXT/([A-Z][a-z0-9_]+)/-${1:/downcase}/g}",
      "when": "editorHasSelection"
    }
  }
}
```

-----------------

## 11. Arbitrary args pass straight through

`command-alias` does not inspect or validate the fields inside `args` -
whatever you put there (a bare string like `preCommands` here, an array
for `replace`, even an empty `description`) is forwarded exactly as-is to
the target command.

```jsonc
// before (keybindings.json)
{
  "key": "alt+s",
  "command": "findInCurrentFile",
  "args": {
    "description": "",            // whatever you find helpful here
    "preCommands": "cursorHomeSelect",
    "find": "(\\$1) (\\d+)",
    "isRegex": true,
    "replace": [
      "$${script:math_with_numbers}$$"
    ],
    "restrictFind": "line"
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
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
}
```

Note: since `findInCurrentFile` can only appear once as a top-level key
in `"command aliases"`, this `"Run Math Script on Line"` alias would in
practice be added as a third sibling inside the combined block from
examples 4 and 5, not as a separate `findInCurrentFile` key.

-----------------

## 12. `editor.actions.findWithArgs`

```jsonc
// before (keybindings.json)
{
  "key": "ctrl+f",
  "command": "editor.actions.findWithArgs",
  "args": {
    "isRegex": true,
    "searchString": "^${selectedText}(?:(?=\\w))"
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "editor.actions.findWithArgs": {
    "Find Selected Text at Line Start": {
      "isRegex": true,
      "searchString": "^${selectedText}(?:(?=\\w))"
    }
  }
}
```

-----------------

## 13. A third-party extension command

The command does not need to be a built-in vscode command - here it is
from the `jump-and-select` extension.

```jsonc
// before (keybindings.json)
{
  "key": "alt+down",
  "command": "jump-and-select.bySymbol",
  "args": {
    "symbols": "method",
    "where": "nextStart",
    "select": true
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "jump-and-select.bySymbol": {
    "Next Method": {
      "symbols": "method",
      "where": "nextStart",
      "select": true
    }
  }
}
```

-----------------

## 14. Another third-party extension command

```jsonc
// before (keybindings.json)
{
  "key": "alt+k",
  "command": "jump-and-select.jumpForwardSelect",
  "args": {
    "text": "^\\s*?$",
    "isRegex": true,
    "select": "match",
    "putCursorOnForwardSelect": "afterCharacter"
  }
}
```

```jsonc
// after ("command aliases" in settings.json)
"command aliases": {
  "jump-and-select.jumpForwardSelect": {
    "Select to Next Blank Line": {
      "text": "^\\s*?$",
      "isRegex": true,
      "select": "match",
      "putCursorOnForwardSelect": "afterCharacter"
    }
  }
}
```

-----------------

## After you save settings.json

* Reload vscode - required before a new or changed alias shows up in the
  Command Palette or Keyboard Shortcuts. See README's `Requirements`
  section for details.

* An alias title with spaces (like `"Select Between Parens"`) becomes an
  underscore-joined command id (`Select_Between_Parens`) for use in
  `keybindings.json` or macros - see README's explanation near the
  `sendSequence` example.

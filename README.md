# Command Aliases  

Create your own aliases for commands in vscode.  A command can have multiple aliases if you want.  The aliases are the command titles/labels that show up in the Command Palette.  Any built-in titles are not removed.  Some built-in commands don't have any title; this extension can quickly create an simple title for any command.  

With v0.7.0 you can use arguments for more commands (maybe all) and use a `when` clause which will determine when that alias appears in the Command Palette.

With v0.5.0 you can create aliases for `workbench.action.terminal.sendSequence` commands, each with different arguments.  See below for an example.  

-------------------

## Extension Settings  

### Commands  

* `command-alias.createAliases`: opens a QuickPick listing of all commands, and automates the process of creating the `Command Alias` setting with your selected commands.  You can use this command before you have any `Command Alias` settings or after you have already created some settings, the new settings will be appended.

Upon selecting any number of commands in the QuickPick, you will be asked for an alias for each one.  Manually editing the settings you can add multiple aliases to each command.  Using this more automated process you can, at present, add only one alias per command.

If you do not supply an alias for a command a default value will be created: `<defaultAlias>`.

```jsonc
"command aliases": {
  "explorer.newFile": "touch",      // some command: your alias
  "explorer.newFolder": "mkdir",
  "history.showPrevious": "<defaultAlias>",
  "undo": "<defaultAlias>"
}
```

Identical aliases for different commands do work.

------------

You can create multiple aliases for any command either manually (as shown below in the **Settings** section below) or through the `createAliases` command process.  For each command you choose in the QuickPick an `input box` will open asking for your alias(es) for that command.

If you want to enter multiple aliases for that command just enter a comma-separated list of those aliases, like:  

`myAlias1, myAlias2, someOtherAlias`

Leading and trailing whitespace will be removed from each alias entered.  

If you try to create an alias that is just an empty string, it will converted to a `<defaultAlias>` and will appear as that in your settings.  Also, empty strings will be removed from the input box if you try to enter something like `Alias1,,,Alias2`.  That will be converted to `A1ias1,Alias2`.  

It is necessary to create these default alias entries because vscode **requires** all commands to have these labels/titles - there would be nothing to display in the Command Palette otherwise.  

If you **manually** create an entry without an alias you will see this error message from vscode on trying to reload:  

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/ErrorMessageNoTitle.jpg?raw=true" width="800" height="175" alt="no title error message"/>

-------------
<br/>

General demo of the `command-alias.createAliases` process:

<br/>

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/fullDemo.gif?raw=true" width="900" height="600" alt="createAliases command demo"/>  

<br/>

* Note that if you edit the `"commandAlias.category"` in the Settings UI as shown above that vscode has a rather short debounce lag for typing entries into that field.  So vscode will update the setting before you may be finished typing the `category` entry - and that will cause this extension to warn you about reloading vscode.  You can ignore the `reload` message until you are done with the Settings UI.

-----------

### Settings  

This extension contributes the following settings:
  
1.  ` "command aliases": {}`  
2.  `"commandAlias.category": "someString"`  

------

**`command aliases`** : are a group of commands and their titles or aliases.  You choose a command and add an alias to it.  Example in `settings.json` (user settings):  

```jsonc
"command aliases": {

  "explorer.newFile": "touch",
  "explorer.newFolder": ["mkdir", "new directory"],     // multiple aliases : use an array  

  "launches.showAllLaunchConfigs": "QP configs",        // an extension command  

  "workbench.action.reloadWindow": "restart"
}
```

The commands are the same as those you could copy from the `Keyboard Shortcuts` list.  Use `Copy Command ID` from each command's context menu to get the actual command.

Commands are then generated from these settings either on load of the extension or when you make any change to its settings.  This extension's package.json is updated to contribute these commands and activationEvents.

-----

**`commandAlias.category`**: the 'category' is text that precedes your command aliases in the Command Palette, like the word `Debug` in &nbsp; `Debug: Clear Console`.  

The default category is `Alias` so that your commands may appear as `Alias: mkdir` or `Alias: touch` for example.  Youy can change that preceding word to an empty string or to another word in the UI Settings or in your own `settings.json` manually.

Examples of different `categories` as shown in the Command Palette:  

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/KeyboardShortcutsAlias.jpg?raw=true" width="900" height="350" alt="Custom category demo"/>

<br/> <br/>

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/AliasDemoEmptyString.gif?raw=true" width="700" height="450" alt="empty string category demo"/>

<br/>

-----------------  

You can re-use aliases for different commands - in that case vscode will show both aliases and the commands they are associated with in the Command Palette so you could pick the one you want.  I suppose you could group commands in this way.  [You could also group commands with the `category` setting.]

If you had this in your settings:  

```jsonc
  "command aliases": {
    "addRootFolder": "mkdir",
    "explorer.newFolder": "mkdir"
  }
  ```

  you would see in this in your Command Palette upon typing `mkdir`:  

  <br/>

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/commandPaletteWithDuplicateAliasess.gif?raw=true" width="500" height="275" alt="duplicate aliases in the commnad palette demo"/>

<br/>

> The gif above uses a `commandAlias.category` set to the empty string so no category word is shown preceding the command.

-----------  
-----------  

### Using arguments and a `when` clause in your settings.

Here is how you could use a built-in vscode command `runCommands` which takes arguments in an `command aliases` setting:

```jsonc
"command aliases": {

  "runCommands": {                     // a built-in vscode command
    "Copy Line Down and Comment": {    // the alias you want to give it
      "commands": [                    // you don't need the usual keybinding 'args' wrapper object
        "editor.action.copyLinesDownAction",
        "cursorUp",
        "editor.action.addCommentLine",
        "cursorDown"
      ],
      "when": "editorHasSelection && editorLangId === javascript"
    }
  },

  "debug.startFromConfig": {       // a built-in vscode command
    "Launch node <file>": {        // your alias for the Command Palette
      // "noDebug": true,  // just run it without debugging
      "type": "node",
      "request": "launch",
      "name": "Launch test.js",
      "program": "test.js"
    }
  }
}
```

Thanks to that `when` clause, the command `Copy Line Down and Comment` will only appear in the Command Palette when you are in a javascript file with a selection.  Any context clauses, like `editorHasSelection`, etc., are supported.  

* Note, if you later make a keybinding for this alias (in your `keybindings.json`), you still need to add the `when` clause to that manually.  

---------------
---------------

### Using the command `workbench.action.terminal.sendSequence`:  

If you frequently use this command to send text to the terminal, you can set up aliases so they wil show up in the Command Palette.  [`\u000d` (same as `\r`) is unicode for a `return` so the terminal command runs immediately, it is up to you whether you want that.]  

```jsonc
"command aliases": {

  "explorer.newFile": "touch",
  "explorer.newFolder": ["mkdir", "new directory"],
  "git.checkout": "Git: Switch to...",

  "workbench.action.terminal.sendSequence": [
    { "Run Last Terminal Command": { "text": "\u001b[A\u000d" } },
    { "Set Terminal to Current File Folder": { "text": "cd '${fileDirname}'\r" } }
  ]
},
```

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/sendSequenceDemo.gif?raw=true" width="900" height="500" alt="command palette sendSequence commands demo"/>  

<br/>  

Although you can use command titles like `"Run Last Terminal Command"` in the settings, vscode does not allow commands with spaces.  So that command would necessarily be automatically changed to `"Run_Last_Terminal_Command"` behind the scenes.  The version without spaces should be used in any keybindings or macros.  Like:

```jsonc
{
  "key": "alt+t",
  "command": "Set_Terminal_to_Current_File_Folder"
},
{
  "key": "alt+x",
  "command": "Run_Last_Terminal_Command"
}
```

You can get this altered form of the commands by right-clicking the command in the `Keyboard Shortcuts` and selecting `Copy Command ID` or simply change all spaces to underscores.  

<br/>  

-----------------

Here are the various forms you can use in your `settings.json`:

```jsonc
"command aliases": {
  "debug.startFromConfig": {      // with arguments
    "Launch node <file>": {
      // "noDebug": true,  // just run it without debugging
      "type": "node",
      "request": "launch",
      "name": "Launch test.js",
      "program": "test.js"
    }
  },
  "runCommands": {
    "Copy Line Down and Comment": {  //with arguments and a when cluase
      "commands": [
        "editor.action.copyLinesDownAction",
        "cursorUp",
        "editor.action.addCommentLine",
        "cursorDown"
      ],
      "when": "editorHasSelection && editorLangId === javascript"
    }
  },
  "explorer.newFile": [     // two versions with no arguments
    "touch",
    "touch2"
  ],
  "explorer.newFolder": [   // use an array for multiple entries
    {
      "mkdir": {
        "when": "editorLangId === javascript" 
      }
    },
    "new directory"        // simple version
  // both "mkdir" and "new directory" will appear in the Command Palette
  ],
  "git.checkout": "Git: Switch to...",         // simplest version
  "workbench.action.terminal.sendSequence": [
    {
      "Run Last Terminal Command": {
        "text": "\u001b[A\u000d"
      }
    },
    {
      "Set Terminal to Current File Folder": {
        "text": "cd '${fileDirname}'\r"
      }
    }
  ]
}
```

See [Settings_examples.md](Settings_examples.md) for more real-world before/after examples converting actual `keybindings.json` entries into `command aliases` settings.

-----------------  
------------  

### You can eliminate any aliases from vscode by deleting or commenting-out their setting - then reloading as prompted.  

* You do not need to uninstall this extension to remove the aliases from the Command Palette.

* Likewise for eliminating any single alias or command, just delete or comment that line in your `settings.json` and reload.

-----------  
-----------  

## Requirements

* Make sure your `settings.json` file is saved and not in a dirty state prior to running the `createAliases` command.  This extension cannot write into a dirty file. If you try to write to a dirty `settings.json` file through the `createAliases` command process, you will be prompted ( a modal prompt) to save and your changes will be automatically retried.  

Demo using `createAliases` with a dirty - unsaved - `settings.json` file:  

<br/>

&emsp;&emsp; <img src="https://github.com/ArturoDent/command-alias/blob/main/images/dirtyFileMessage.gif?raw=true" width="850" height="500" alt="reload message"/>

<br/><br/>  

If you choose not to save your `settings.json` the changes will not be made.  
<br/>

-----------

* When you make a change to this extension's settings, you will need to (and will be prompted to) reload vscode.  This is the only way to have the new aliases appear in the Command Palette or Keyboard Shortcuts.  If you are going to make more changes you can safely ignore the prompt.

Or, of course, any changes will take affect the next time vscode is started.

<br/>

<img src="https://github.com/ArturoDent/command-alias/blob/main/images/reloadNotification.jpg?raw=true" width="525" height="150" alt="reload message"/>

<br/>

---------------

## Known Issues  

* see `Requirements` above re: reload on changes.  

* Don't use the same command in multiple places in the settings.  Vscode will flag as a JSON error: duplicate key.  

* If there are multiple vscode windows open with this extension running, they will all get the notification prompt to reload when making a `command alias` setting change in any one window.  It has been my experience that it is sufficient to just reload the window where you made the settings changes.

## Release Notes  

* 0.1.0 &emsp;  Initial release.
* 0.1.2 &emsp;  Fixed: notification only appears if change 'command-alias' setting.
* 0.2.1 &emsp;  Worked on reload not updating properly on a `category` change.  
* 0.3.0 &emsp;  Added the `createAliases` QuickPick process for automating the generation of settings.
* 0.4.0 &emsp;  Catch error: writing to dirty settings and prompt, save and retry.  
&emsp;&emsp; &emsp; Added ability to add multiple aliases through the `createAliases` InputBox.
* 0.5.0 &emsp;  Added support for multiple `workbench.action.terminal.sendSequence` command with args.  
* 0.5.5 &emsp;  Added support for Command titles to be used in keybindings.
&emsp;&emsp; &emsp; Refactored settings arguments in preparation for commands that use multiple arguments.  
* 0.7.0 &emsp;  Added support for `when` context clauses and more/all arguments.  

### TODO

[ X ] - Explore using command titles as command names in keybindings.  
[ X ] - Explore using multiple args for certain commands.  
[&emsp; ] - Explore the ability to specify any number of `categories` and assign to different commands.  

-----------------------------------------------------------------------------------------------------------

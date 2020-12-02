# Command Aliases  

  Create your own aliases for commands in vscode.  A command can have multiple aliases if you want.  The aliases are the command titles that show up in the command palette.  The built-in titles are not removed.  

  <br/>

## Requirements 

When you make a change to these settings, you will need to (and will be prompted to) reload vscode.  This is the only way to see the new aliases in the command palette.  Or, of course, any changes will take affect the next time vscode is started.

<br/>

<!-- ![Reload notification message](images/reloadNotification.jpg) -->

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/reloadNotification.jpg?raw=true" width="325" height="150" alt="Keybindings shortcuts demo"/>

<br/><br/>

## Extension Settings  

This extension contributes the following settings:

* `command aliases`: a group of commands and titles/aliases.  Example in settings.json (user settings): 

```jsonc
  "command aliases": {
    // multiple aliases for the same command
    "editor.action.copyLinesDownAction": ["Shimmy", "slide", "copyDown"],
    "explorer.newFolder": "mkdir",        // single alias doesn't need to be in an array but can be
    "editor.action.clipboardCutAction": "delete to clipboard"

  }
  ```
Commands are then generated from these settings either on load of the extension or when you make any change to its setting.  This extension's package.json is updated to contribute these commands and activationEvents.

-----------

You can re-use alaises for different commands - in that case vscode will show both alaiases and the commands they are associated with in the command palette so you could pick the one you want.  I suppose you could group commands in this way.

If you had this in your settings:  

```jsonc
  "command aliases": {
    "addRootFolder": "mkdir",
    "explorer.newFolder": "mkdir"
  }
  ```

  you would see in this in your command palette upon typing `mkdir`:

  <!-- ![Reload notification message](images/reloadNotification.jpg) -->

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/commandPaletteWithDuplicateAliases.gif?raw=true" width="325" height="150" alt="Keybindings shortcuts demo"/>


## Known Issues  

* see Requirements above 


## Release Notes  

### 0.1.0

* Initial release.

## TODO

* Detect re-use of aliases.
* Add a QuickPick panel of commands from which to select and add to `command aliases` settings.


-----------------------------------------------------------------------------------------------------------
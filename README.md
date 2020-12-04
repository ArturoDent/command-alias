# Command Aliases  

  Create your own aliases for commands in vscode.  A command can have multiple aliases if you want.  The aliases are the command titles that show up in the Command Palette.  The built-in titles are not removed.  

  <br/>

## Requirements

When you make a change to these settings, you will need to (and will be prompted to) reload vscode.  This is the only way to see the new aliases in the Command Palette.  Or, of course, any changes will take affect the next time vscode is started.

<br/>

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/reloadNotification.jpg?raw=true" width="625" height="200" alt="Keybindings shortcuts demo"/>

<br/><br/>

## Extension Settings  

This extension contributes the following settings group:

* `command aliases`: a group of commands and their titles or aliases.  You choose a command and add an alias to it.  Example in `settings.json` (user settings): 

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

<br/>

This extension also contributes the following setting:

* `commandAlias.category`: the 'category' is a word that precedes your command aliases in the Command Palette, like the word `Debug` in `Debug: Clear Console`.  

The default category is `Alias` so that your commands may appear as `Alias: mkdir` or `Alias: touch` for example.  Youy can change that preceding word to an empty string or to another word in the UI Settings or in your own `settings.json` manually.

Example in `settings.json` (user settings): 

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/settingsDemo.gif?raw=true" width="1000" height="400" alt="settings demo"/>

-----------

You can re-use aliases for different commands - in that case vscode will show both aliases and the commands they are associated with in the Command Palette so you could pick the one you want.  I suppose you could group commands in this way.

If you had this in your settings:  

```jsonc
  "command aliases": {
    "addRootFolder": "mkdir",
    "explorer.newFolder": "mkdir"
  }
  ```

  you would see in this in your Command Palette upon typing `mkdir`:  

  <br/>

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/commandPaletteWithDuplicateAliasess.gif?raw=true" width="725" height="250" alt="Keybindings shortcuts demo"/>

<br/><br/>

> The gif above uses a `commandAlias.category` set to the empty string so no category word is shown preceding the command.
<br/> 

-----------

## Known Issues  

* see `Requirements` above re: reload on changes.
* Don't use the same command in multiple places in the settings.


## Release Notes  

* 0.1.0 &emsp;  Initial release.
* 0.1.2 &emsp;  Fixed: notification only appears if change 'command-alias' setting.  

### TODO

* Prevent listing the same command multiple times in the settings.
* Add a QuickPick panel of commands from which to select and add to `command aliases` settings.


-----------------------------------------------------------------------------------------------------------
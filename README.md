# Command Aliases  

  Create your own aliases for commands in vscode.  A command can have multiple aliases if you want.  The aliases are the command titles that show up in the Command Palette.  The built-in titles are not removed.  

  <br/>

## Requirements

* Make sure your `settings.json` file is saved and not in a dirty state.  This extesnion cannot write into a dirty file = silent failure.

* When you make a change to these settings, you will need to (and will be prompted to) reload vscode.  This is the only way to have the new aliases appear in the Command Palette.  Or, of course, any changes will take affect the next time vscode is started.

<br/>

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/reloadNotification.jpg?raw=true" width="725" height="200" alt="reload message"/>

<br/>

-------------------

## Extension Settings  

### Commands    

* `command-alias.createAliases`: opens a QuickPick listing of all commands, and automates the process of creating the `Command Alias` setting with your selected commands.  You can use this command before you have any `Command Alias` settings or if after you have already created some settings, the new settings will be appended.

Upon selecting any number of commands in the QuickPick, you will be asked for an alias for each one.  Manually editing the settings you can add multiple aliases to each command.  Using this more automated process you can, at present, add only one alias per command.

If you do not supply an alias for a command a default value will be created: `<defaultAlias>`.

```jsonc
"command aliases": {
  "explorer.newFile": "touch",
  "explorer.newFolder": "mkdir",
  "history.showPrevious": "<defaultAlias>",
  "undo": "<defaultAlias>"
}
```

Identical aliases for different commands do work.  

It is necessary to create these default alias entries because vscode **requires** all commands to have these labels/titles - there would be nothing to display in the Command Palette otherwise.  If you **manually** create an entry without an alias you will see this error message from vscode on trying to reload:

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/ErrorMessageNoTitle.jpg?raw=true" width="900" height="200" alt="no title error message"/>

-------------
<br/>

General demo of the `command-alias.createAliases` process:

<br/>

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/fullDemo.gif?raw=true" width="725" height="600" alt="createAliases command demo"/>  

<br/>

* Note that if you edit the `command.category` in the Settings UI as shown above that vscode has a rather short debounce lag for typing entries into that field.  So vscode will update the setting before you may be finished typing the `category` entry - and that will cause this extension to warn you about reloading vscode.  You can ignore the `reload` message until you are done with the Settings UI.

-----------


----------------  

### Settings  

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

* `commandAlias.category`: the 'category' is text that precedes your command aliases in the Command Palette, like the word `Debug` in `Debug: Clear Console`.  

The default category is `Alias` so that your commands may appear as `Alias: mkdir` or `Alias: touch` for example.  Youy can change that preceding word to an empty string or to another word in the UI Settings or in your own `settings.json` manually.

Examples in `settings.json` (user settings): 

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/AliasDemoWithhAlias.gif?raw=true" width="725" height="600" alt="Custom category demo"/>

<br/>

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/AliasDemoEmptyString.gif?raw=true" width="725" height="600" alt="empty string category demo"/>

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

<img src="https://github.com/ArturoDent/command-alias/blob/master/images/commandPaletteWithDuplicateAliasess.gif?raw=true" width="725" height="350" alt="duplicate aliases in the commnad palette demo"/>

<br/><br/>

> The gif above uses a `commandAlias.category` set to the empty string so no category word is shown preceding the command.
<br/>

-----------

## Known Issues  

* see `Requirements` above re: reload on changes.  

* Don't use the same command in multiple places in the settings.  Vscode will flag as a JSON error.    

* If there are multiple vscode windows open with this extension running, they will all get the notification prompt to reload when making a `command alias` setting change in any one window.  It has been my experience that it is sufficient to just reload the window where you made the settings changes.


## Release Notes  

* 0.1.0 &emsp;  Initial release.
* 0.1.2 &emsp;  Fixed: notification only appears if change 'command-alias' setting.
* 0.2.1 &emsp;  Worked on reload not updating properly on a `category` change. 
* 0.3.0 &emsp;  Added the `createAliases` QuickPick process for automating the generation of settings.   

### TODO

[ X ]     - Add a QuickPick panel of commands from which to select and add to `command aliases` settings.  
[&emsp; ] - Make the QuickPick panel take an a comma-separated list of aliases for each command.   
[&emsp; ] - Investigate the ability to specify any number of `categories` and assign to different commands.  


-----------------------------------------------------------------------------------------------------------
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const settingsJS = require('./settings.js');
const packageJSON = require('./packageJSON.js');

let disposables = [];


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

  // remove?
  // let thisExtension = vscode.extensions.getExtension('ArturoDent.command-alias');

  let disposable;

  // get the 'category' setting: as in 'Alias' (the default) in 'Alias:mkdir' in the command palette
  // commandAlias.category = String
  let category = settingsJS.getCategorySetting();

  // load this extension's settings, make commands and activation events from them
  await loadCommands(context, category);

  // if this extension's 'command aliases' settings are changed, reload the commands
  // notify user of the need to reload vscode
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async (event) => {

    // if (event.affectsConfiguration('command aliases')) {
    if (event.affectsConfiguration('command aliases') || event.affectsConfiguration('commandAlias')) {
      
      let category = settingsJS.getCategorySetting();
      await loadCommands(context, category);  // reload commands with their aliases

      vscode.window
        .showInformationMessage("You must reload vscode to see the changes you made to the 'command aliases' setting.",
          ...['Reload vscode', 'Do not Reload'])   // two buttons
        .then(selected => {
          if (selected === 'Reload vscode') vscode.commands.executeCommand('workbench.action.reloadWindow');
          else vscode.commands.executeCommand('leaveEditorMessage');
        });
    }
  }));

  context.subscriptions.push(disposable);
  disposables.push(disposable);

  disposable = vscode.commands.registerCommand('command-alias.createAliases', async function () {

    // QuickPick returns an array of strings: 'commands'
    loadCommandQuickPick().then(async commands => {

      if (!commands) return;  // user closed without selecting any

      let inputBoxOptions = {
        ignoreFocusOut: true
        // placeHolder: `<enter your alias here>`,
      };

      let newCommands = {};

      for (const command of commands) {

        inputBoxOptions.prompt = `Enter an alias for the command: ${ command } . . . . . `;
        inputBoxOptions.placeHolder = `your alias for ${ command } here`;

        await vscode.window.showInputBox(inputBoxOptions)
          .then(alias => {
            newCommands[command] = alias;
          });
      }
      // newCommands = { history.showPrevious: "Alias1", history.showNext: "Alias2" }
      // call function to add chosen commands to settings.json (global= user/workspace/workspaceFolder?)
      updateCommandAliasesSettings(newCommands);
    });
  });

  context.subscriptions.push(disposable);
  disposables.push(disposable);
}


/**
 * @description - load this extension's settings, make commands and activation events from them
 * @description - if different than existing package.json, write the new commands/events to package.json
 * @description - and vscode.commands.registerCommands() all commands whether new or old
 * 
 * @param {*} context - the extension.context
 * @param {String} category - like 'Alias', the default, in 'Alias:mkdir' in the command palette
 */
async function loadCommands(context,category) {
  
  let thisExtension = vscode.extensions.getExtension('ArturoDent.command-alias');
  let disposable;

  let packageCommands;
  let settingsPackageCommands;
  let packageEvents;
  let settingsEvents;

  const currentSettings = settingsJS.getCurrentSettings();

  if (currentSettings) {
     
    packageCommands = packageJSON.getPackageJSONCommands();
    settingsPackageCommands = settingsJS.makePackageCommandsFromSettings(currentSettings, category);

    packageEvents = thisExtension.packageJSON.activationEvents;
    settingsEvents = settingsJS.makeSettingsEventsFromSettingsPackageCommands(settingsPackageCommands);


    if (!commandArraysAreEquivalent(settingsPackageCommands, packageCommands) ||
        !activationEventArraysAreEquivalent(settingsEvents, packageEvents)) {
      
      thisExtension.packageJSON.contributes.commands = settingsPackageCommands;
      thisExtension.packageJSON.activationEvents = settingsEvents;

      fs.writeFileSync(path.join(context.extensionPath, 'package.json'), JSON.stringify(thisExtension.packageJSON, null, 1));
    }
  }

    // {
    //   "command": "command-alias.editor.action.copyLinesDownAction.1",
    //   "title": "Shimmy"
    //  },
  
  const allCommands = await vscode.commands.getCommands(true);

  
  for (const pcommand of packageCommands) {

    // skip already regisitered commands
    if (allCommands.includes(pcommand.command)) continue;

    if (pcommand.command !== 'command-alias.createAliases') {

      let makeCommand = pcommand.command.replace(/^command-alias\./m, '').replace(/\.\d+$/m, '');

      // rejected promise: Error: command 'someCommand' already exists fixed with includes() check above
      disposable = vscode.commands.registerCommand(pcommand.command, function () {
        vscode.commands.executeCommand(makeCommand);
      });
      context.subscriptions.push(disposable);
      disposables.push(disposable);
    }
  };
}

/**
 * @description - are the settings and package.json commands the same?
 * 
 * @param {Array} settings - commands constructed from the settings.json 'command aliases'
 * @param {Array} packages - the pre-existing commands from package.json
 * @returns {boolean}
 */
function commandArraysAreEquivalent(settings, packages) {
  
  if (settings.length !== packages.length) return false;

  return settings.every(setting => packages.some(pcommand => {
    return (pcommand.command === setting.command) && (pcommand.title === setting.title) && 
    (pcommand.category === setting.category);
  }));
}


/**
 * @description - are the settings and package.json activationEvents the same?
 * 
 * @param {Array} settings - activationEvents constructed from the settings.json 'command aliases'
 * @param {Array} packages - the pre-existing activationEvents from package.json
 * @returns {boolean}
 */
function activationEventArraysAreEquivalent(settings, packages) {

  //   "onCommand:command-alias.editor.action.clipboardCutAction.1",

  if (settings.length !== packages.length) return false;

  return settings.every(setting => packages.some(pevent => {
    return (pevent === setting);
  }));
}


/**
 * @description - open a QuickPick of all available commands
 * @returns - the QuickPick 
 */
function loadCommandQuickPick() {
  
  // populate a QuickPick with all commands; true = no internal commands
  let commands = vscode.commands.getCommands(true);

  return vscode.window.showQuickPick(commands, {
    canPickMany: true,
    placeHolder: "Select as many commands as you want for which to create aliases",
  });
}

/**
 * @description - add new items (with a <defaultAlias> if necessary) to user settings
 * 
 * @param {Object} newCommands - commands: aliases as selected in the QuickPick
 */
async function updateCommandAliasesSettings(newCommands) {
  
  // the {} at the end is a default value to return if no value is found
  const currentValue = vscode.workspace.getConfiguration().get('command aliases', {});
  let newValues = {};
  
  // newCommands = { history.showPrevious: "Alias1", history.showNext: "Alias2" }
  for (let [key, value] of Object.entries(newCommands)) {
    value = value ? value : `<defaultAlias>`;
    newValues = { ...newValues, ...{ [key]: value } }
  }
  const updatedValue = { ...currentValue, ...newValues };

  // vscode.ConfigurationTarget.Global = user settings.json
  await vscode.workspace.getConfiguration().update('command aliases', updatedValue, vscode.ConfigurationTarget.Global);

  // if (missingAlias) {
  //   vscode.window
  //     .showInformationMessage(`Do you want to open your settings.json to add the missing aliases?  
  //     You can't leave an alias as an empty string - it will generate an error message.`,
  //       { modal: true },
  //       ...['Open Settings'])   // two buttons: 'Open Settings' and 'Cancel' (which is auto-generated)
  //     .then(selected => {
  //   if (selected === 'Open Settings') vscode.commands.executeCommand('workbench.action.openSettingsJson');
  //         //  .then() scroll to command aliases settings location, select missing alias
  //       // else vscode.commands.executeCommand('leaveEditorMessage');
  //     });
  // }
}
    
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

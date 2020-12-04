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
  vscode.workspace.onDidChangeConfiguration(async (event) => {

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
  });

  context.subscriptions.push(disposable);
  disposables.push(disposable);

  disposable = vscode.commands.registerCommand('command-alias.createAliases', function () {

    loadCommandQuickPick().then(commands => {
      if (!commands) return;
      // call function to add chosen commands to settings.json (global/**user**/workspace?)
      console.log(commands);
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
    
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}

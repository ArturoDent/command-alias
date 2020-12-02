const vscode = require('vscode');


/**
 * @description - get the settings for 'command aliases'
 * 
 * @returns - an array of settings.json entries for this extension
 */
exports.getCurrentSettings = async function () {  

  let currentSettings = vscode.workspace.getConfiguration('command aliases');
  let commandArray = Object.entries(currentSettings);
  commandArray = commandArray.filter(current => (typeof current[1] === 'string') || (typeof current[1] === 'object'));
  
  return commandArray;
};


/**
 * @description - transform the settings into package.json- style commands {command: "", title: ""}
 * 
 * @param {object} settings - this extension's settings from getCurrentSettings()
 * @returns - package.json form of 'contributes.commands'
 */
exports.makePackageCommandsFromSettings = async function (settings) {
  
  let settingsJSON = [];

  let newCommand = {};
  newCommand.command = "command-alias.createAliases";
  newCommand.title = "Command Alias: Create aliases from vscode's built-in commands";

  settingsJSON.push(newCommand);
  let numAlias;

  for (const setting of settings) {
  
    if (Array.isArray(setting[1])) {
      numAlias = 1;
    
      for (const alias of setting[1]) {
        let newCommand = {};
        newCommand.command = `command-alias.${ setting[0] }.${ numAlias++ }`;
        newCommand.title = alias;
        settingsJSON.push(newCommand);
      }
    }
    else {
      numAlias = 1;
      let newCommand = {};
      newCommand.command = `command-alias.${ setting[0] }.${ numAlias }`;
      newCommand.title = setting[1];
      settingsJSON.push(newCommand);
    }
  };

  return settingsJSON;
};


/**
 * @description - transform the settings (already transformed to package.json-style commands)
 * @description - into package.json 'activationEvents' : 'onCommand:<some command>'
 * 
 * @param {object} settingsCommands - 
 * @returns - an array of strings for package.json activationEvents
 */
exports.makeSettingsEventsFromSettingsPackageCommands = async function (settingsCommands) {

  // "activationEvents": [
  //   "onStartupFinished",
  //   "onCommand:command-alias.createAliases",
  //   "onCommand:command-alias.editor.action.clipboardCutAction",
  //   "onCommand:command-alias.editor.action.clipboardPasteAction"
  // ],

  let settingsJSON = [];
  settingsJSON.push("onStartupFinished");

  for (const command of settingsCommands) {
    settingsJSON.push(`onCommand:${ command.command }`);
  }
  return settingsJSON;
};
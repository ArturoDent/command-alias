const vscode = require('vscode');


/**
 * Get the settings for 'command aliases' *
 * @returns {Array}- an array of settings.json entries for this extension
 */
exports.getCurrentSettings = function () {

  let currentSettings = vscode.workspace.getConfiguration('command aliases');
  let commandArray = Object.entries(currentSettings);
  commandArray = commandArray.filter(current => (typeof current[1] === 'string') || (Array.isArray(current[1])));

  return commandArray;
};

/**
 * Get the Command Palette 'category'
 * @returns {String}
 */
exports.getCategorySetting = function () {
  return vscode.workspace.getConfiguration('commandAlias').get('category');
};


/**
 * Transform the settings into package.json- style commands {command: "", title: ""}
 *
 * @param {Object} settings - this extension's settings from getCurrentSettings()
 * @param {String} userCategory - the category of the command in the command palette
 * @returns - package.json form of 'contributes.commands'
 */
exports.makePackageCommandsFromSettings = function (settings, userCategory) {

	let settingsJSON = [];

	let newCommand = {};
	newCommand.command = "command-alias.createAliases";
	newCommand.title = "Create aliases from vscode's built-in commands";
	newCommand.category = userCategory;

	settingsJSON.push(newCommand);

	// {
	// 	"explorer.newFile": "touch",
	// 	"explorer.newFolder": ["mkdir", "new directory"],
	// 	"git.checkout": "Git: Switch to...",

	// 	"workbench.action.terminal.sendSequence": [
	// 		{ "Open Styles": { "text": "code -r '../style.scss'\r" } },
	// 		{ "Change Terminal Directory": { "text": "cd '${fileDirname}'\r" } }
	// 	]
	// }

	for (const setting of settings) {

		if (Array.isArray(setting[1]) && (typeof setting[1][0] === "object")) {

      for (const item of setting[1]) {
        let newCommand = {};
				newCommand.command = Object.keys(item)[0].replace(/\s+/g, "_");
				newCommand.run = setting[0];
        newCommand.title = Object.keys(item)[0];
				newCommand.category = userCategory;
				newCommand.args = Object.values(item)[0];
        settingsJSON.push(newCommand);
      }
    }

    else if (Array.isArray(setting[1])) {

      for (const item of setting[1]) {
        let newCommand = {};
				newCommand.command = item.replace(/\s+/g, "_");
				newCommand.run = setting[0];
        newCommand.title = item;
        newCommand.category = userCategory;
        settingsJSON.push(newCommand);
      }
    }
    else {
      let newCommand = {};
			newCommand.command = setting[1].replace(/\s+/g, "_");
			newCommand.run = setting[0];
      newCommand.title = setting[1];
			newCommand.category = userCategory;
      settingsJSON.push(newCommand);
    }
  };

  return settingsJSON;
};


/**
 * Transform the settings (already transformed to package.json-style commands)
 * into package.json 'activationEvents' : 'onCommand:<some command>'
 *
 * @param {Object} settingsCommands -
 * @returns {Array<String>} - an array of strings for package.json activationEvents
 */
exports.makeSettingsEventsFromSettingsPackageCommands = function (settingsCommands) {

  // "activationEvents": [
    // "onStartupFinished",
    // "onCommand:command-alias.createAliases",
    // "onCommand:command-alias.editor.action.clipboardCutAction",
    // "onCommand:command-alias.editor.action.clipboardPasteAction"
  // ],

  let settingsJSON = [];
  settingsJSON.push("onStartupFinished");

  for (const command of settingsCommands) {
    settingsJSON.push(`onCommand:${ command.command }`);
  }
  return settingsJSON;
};
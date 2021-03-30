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
	let numAlias;

  // {
  //   "explorer.newFile": ["touch","touch2"],
  //   "explorer.newFolder": "mkdir",
  //   "git.checkout": "Git: Switch to...",
	// 		"workbench.action.terminal.sendSequence": [
  //    	{"pandoc1": "echo ${file} 1"},
  //    	{"pandoc2": "echo ${file} 2"}
  //   ]
  // };

	//   "command": "workbench.action.terminal.sendSequence",
  //   "args": {
  //     "text": "awk -f '${file}'\u000D",
  //   }

	for (const setting of settings) {

		if (Array.isArray(setting[1]) && (typeof setting[1][0] === "object")) {
      numAlias = 1;

      for (const item of setting[1]) {
        let newCommand = {};
        newCommand.command = `command-alias.${ setting[0] }.${ numAlias++ }`;
        newCommand.title = Object.keys(item)[0];
				newCommand.category = userCategory;
				const args = {
					text: `${Object.values(item)[0]}`
				};
				newCommand.args = args;
        settingsJSON.push(newCommand);
      }
    }

    else if (Array.isArray(setting[1])) {
      numAlias = 1;

      for (const item of setting[1]) {
        let newCommand = {};
        newCommand.command = `command-alias.${ setting[0] }.${ numAlias++ }`;
        newCommand.title = item;
        newCommand.category = userCategory;
        settingsJSON.push(newCommand);
      }
    }
    else {
      numAlias = 1;
      let newCommand = {};
      newCommand.command = `command-alias.${ setting[0] }.${ numAlias }`;
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
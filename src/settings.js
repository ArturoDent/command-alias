const vscode = require('vscode');


/**
 * Get the settings for 'command aliases' *
 * @returns {*}- an array of settings.json entries for this extension
 */
exports.getCurrentSettings = function () {

  let currentSettings = vscode.workspace.getConfiguration('command aliases');
  let commandArray = Object.entries(currentSettings);
  // commandArray = commandArray.filter(current => (typeof current[1] === 'string') || (Array.isArray(current[1])));
  commandArray = commandArray.filter(current => current[1] !== null && (typeof current[1] !== 'function'));

  return commandArray;
};

/**
 * Get the Command Palette 'category'
 * @returns {String}
 */
exports.getCategorySetting = function () {
  return vscode.workspace.getConfiguration('commandAlias').get('category', 'Alias');
};


/**
 * Some built-in vscode commands take a bare (non-object) args value, e.g.
 * "args": "% " for workbench.action.showCommands. An explicit "args" key
 * in the setting signals "this value is the literal args, don't wrap it" -
 * needed since a bare string/array/etc value can't also carry a sibling
 * 'when' clause. Falls back to today's behavior (the object itself, minus
 * 'when', is the args) when no explicit 'args' key is present.
 *
 * @param {*} cloned - the per-alias value, with 'when' already stripped
 * @returns {*}
 */
function resolveArgs(cloned) {
  if (cloned && typeof cloned === 'object' && 'args' in cloned && Object.keys(cloned).length === 1) return cloned.args;
  return cloned;
}


/**
 * runCommands' own 'commands' steps must be {command, args} for vscode to run them.
 * Lets settings author a step as the shorthand {"commandId": {args}} instead;
 * plain string steps and already-correct {command, args} steps pass through untouched.
 *
 * @param {String} run - the base command this alias runs, e.g. 'runCommands'
 * @param {*} args - the alias's args object, possibly containing a 'commands' array
 * @returns {*} - args, with any shorthand steps in 'commands' normalized
 */
function normalizeRunCommandsSteps(run, args) {

  if (run !== 'runCommands' || !Array.isArray(args.commands)) return args;

  args.commands = args.commands.map((/** @type {*} */ step) => {
    if (typeof step !== "object" || step.command) return step;   // string, or already {command, args}
    const [command, stepArgs] = Object.entries(step)[0];
    return {command, args: stepArgs};
  });

  return args;
}


/**
 * Transform the settings into package.json- style commands {command: "", title: ""}
 *
 * @param {Array<*>} settings - this extension's settings from getCurrentSettings()
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

  // "workbench.action.terminal.sendSequence": [
  // 	{ "Open Styles": { "text": "code -r '../style.scss'\r" } },
  // 	{ "Change Terminal Directory": { "text": "cd '${fileDirname}'\r" } }
  // ]
  // }

  // "command aliases": {
  //   "explorer.newFolder": [
  //     {
  //       "mkdir": {
  //         "when": "editorLangId === javascript",
  //         "text": "howdy"
  //       }
  //     },
  //     "new directory"
  //   ]
  // }

  for (const setting of settings) {

    if (Array.isArray(setting[1])) {

      for (const item of setting[1]) {
        if (typeof item === "object") {
          /** @type {*} */
          let newCommand = {};
          newCommand.command = Object.keys(item)[0].replace(/\s+/g, "_");
          newCommand.run = setting[0];
          newCommand.title = Object.keys(item)[0];
          newCommand.category = userCategory;

          let clonedItem = JSON.parse(JSON.stringify(Object.values(item)[0]));

          if (clonedItem.when) {
            newCommand.enablement = clonedItem.when;
            delete clonedItem.when;
          }

          newCommand.args = normalizeRunCommandsSteps(newCommand.run, resolveArgs(clonedItem));
          settingsJSON.push(newCommand);
        }
        else {   // typeof item === "string"
          let newCommand = {};
          newCommand.command = item.replace(/\s+/g, "_");
          newCommand.run = setting[0];
          newCommand.title = item;
          newCommand.category = userCategory;
          settingsJSON.push(newCommand);
        }
      }
    }

    else if (typeof setting[1] === "string") {
      let newCommand = {};
      newCommand.command = setting[1].replace(/\s+/g, "_");
      newCommand.run = setting[0];
      newCommand.title = setting[1];
      newCommand.category = userCategory;
      settingsJSON.push(newCommand);
    }

    else {
      // an object can have more than one sibling alias under the same base command, e.g.
      // "runCommands": { "Copy Line Down and Comment": {...}, "Select between ()": {...} }
      for (const [title, itemArgs] of Object.entries(setting[1])) {

        /** @type {*} */
        let newCommand = {};
        newCommand.command = title.replace(/\s+/g, "_");
        newCommand.run = setting[0];
        newCommand.title = title;
        newCommand.category = userCategory;

        // structuredClone(itemArgs); doesn't work becuase of Proxy
        let cloned = JSON.parse(JSON.stringify(itemArgs));

        if (cloned.when) {
          newCommand.enablement = cloned.when;
          delete cloned.when;
        }

        newCommand.args = normalizeRunCommandsSteps(newCommand.run, resolveArgs(cloned));
        settingsJSON.push(newCommand);
      }
    }
  };

  return settingsJSON;
};


/**
 * Transform the settings (already transformed to package.json-style commands)
 * into package.json 'activationEvents' : 'onCommand:<some command>'
 *
 * @param {Array<*>} settingsCommands -
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
    settingsJSON.push(`onCommand:${command.command}`);
  }
  return settingsJSON;
};
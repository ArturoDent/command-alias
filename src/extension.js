const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const settingsJS = require('./settings.js');
const packageJSON = require('./packageJSON.js');

// TODO: expose a command to see this extension's package.json and tell how to delete commands ?
// TODO: is there a way to avoid writing all the junk to the package.json that vscode does ?

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

  let disposable;

  // get the 'category' setting: as in 'Alias' (the default) in 'Alias:mkdir' in the command palette
  // commandAlias.category = String
  let category = settingsJS.getCategorySetting();

  // load this extension's settings, make commands and activation events from them
  // if package.json had to be rewritten to match, the new commands won't show up in the
  // Command Palette until a reload - vscode only reads contributes.commands at window startup
  const rewroteOnActivate = await loadCommands(context, category);
  if (rewroteOnActivate) notifyReloadNeeded();

  // if this extension's 'command aliases' settings are changed, reload the commands
  // notify user of the need to reload vscode

  disposable = vscode.workspace.onDidChangeConfiguration(async (event) => {
    // context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async (event) => {

    if (event.affectsConfiguration('command aliases') || event.affectsConfiguration('commandAlias')) {

      let category = settingsJS.getCategorySetting();
      const rewrote = await loadCommands(context, category);  // reload commands with their aliases
      if (rewrote) notifyReloadNeeded();
    }
  });

  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand('command-alias.createAliases', async function () {

    // QuickPick returns an array of strings: 'commands'
    loadCommandQuickPick().then(async commands => {

      // !commands is undefined if QP closed by 'Escape` or focus out, if click 'OK' but no selections QP returns an empty array
      if (!commands || !commands.length) return;  // user closed or no selection(s)

      /** @type {vscode.InputBoxOptions} */
      let inputBoxOptions = {
        ignoreFocusOut: true
      };

      /** @type {Object.<string, string|undefined>} */
      let newCommands = {};

      for (const command of commands) {

        // inputBoxOptions.prompt = `Enter an alias for the command: ${ command } . . . . . `;
        inputBoxOptions.placeHolder = `Enter an alias(es) for the ${ command } here`;

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
}


/**
 * Tell the user their 'command aliases' change won't show up in the Command Palette
 * until vscode reloads - contributes.commands is only read at window startup.
 */
function notifyReloadNeeded() {
  vscode.window
    .showInformationMessage("You must reload vscode to see the changes you made to the 'command aliases' setting.",
      ...['Reload vscode', 'Do not Reload'])   // two buttons
    .then(selected => {
      if (selected === 'Reload vscode') vscode.commands.executeCommand('workbench.action.reloadWindow');
      else vscode.commands.executeCommand('leaveEditorMessage');
    });
}


/**
 * Load this extension's settings, make commands and activation events from them.
 * If different than existing package.json, write the new commands/events to package.json
 *  and vscode.commands.registerCommands() all commands whether new or old
 *
 * @param {*} context - the extension.context
 * @param {String} category - like 'Alias', the default, in 'Alias:mkdir' in the command palette
 * @returns {Promise<boolean>} - true if package.json was rewritten (a reload is needed to see the changes)
 */
async function loadCommands(context, category) {

  let disposable;

  // fresh read from disk on every call - never Extension.packageJSON, which vscode enriches
  // with runtime-only fields (id, identifier, isBuiltin, extensionLocation, etc.) that must
  // never be persisted into the real manifest. Nothing here is cached, so there's no need to
  // separately sync an in-memory copy after writing below.
  const rawPackageJSON = await packageJSON.getPackageJSON();
  const packageCommands = rawPackageJSON.contributes.commands;

  let settingsPackageCommands;
  // let settingsEvents;
  let rewrote = false;

  const currentSettings = settingsJS.getCurrentSettings();

  if (currentSettings) {

    settingsPackageCommands = settingsJS.makePackageCommandsFromSettings(currentSettings, category);

    // TODO: necessary?
    // settingsEvents = settings)JS.makeSettingsEventsFromSettingsPackageCommands(settingsPackageCommands);

    // eliminate activationEventArraysAreEquivalent() reference
    // if (!commandArraysAreEquivalent(settingsPackageCommands, packageCommands) ||
    //   !activationEventArraysAreEquivalent(settingsEvents, packageEvents)) {

    if (!commandArraysAreEquivalent(settingsPackageCommands, packageCommands)) {

      // TODO: is it necessary to do this anymore??
      // rawPackageJSON.activationEvents = settingsEvents;

      rawPackageJSON.contributes.commands = settingsPackageCommands;
      const packageJSONPath = path.join(context.extensionPath, 'package.json');
      fs.writeFileSync(packageJSONPath, JSON.stringify(rawPackageJSON, null, 2));
      rewrote = true;
    }
  }

  // {
  //   "command": "command-alias.editor.action.copyLinesDownAction.1",
  //   "title": "Shimmy"
  //  },

  const allCommands = await vscode.commands.getCommands(true);

  for (const pcommand of packageCommands) {

    let args = {};
    let run = "";

    // skip already registered commands
    // remove args if any (delete command.args) because args is not a property of commands

    if (pcommand.args) {
      args = pcommand.args;
      delete pcommand.args;
    }

    if (pcommand.run) {
      run = pcommand.run;
      delete pcommand.run;
    }

    if (allCommands.includes(pcommand.command)) continue;

    if (pcommand.command !== 'command-alias.createAliases') {

      // let makeCommand = pcommand.command.replace(/^command-alias\./m, '').replace(/\.\d+$/m, '');

      // rejected promise: Error: command 'someCommand' already exists fixed with includes() check above
      disposable = vscode.commands.registerCommand(pcommand.command, function () {
        // if (args) {
        // 	vscode.commands.executeCommand(makeCommand, args);
        // }
        // else vscode.commands.executeCommand(makeCommand);
        vscode.commands.executeCommand(run, args);
      });
      context.subscriptions.push(disposable);
    }
  };

  return rewrote;
}


/**
 * Are the settings and package.json commands the same?
 *
 * @param {Array<*>} settings - commands constructed from the settings.json 'command aliases'
 * @param {Array<*>} packages - the pre-existing commands from package.json
 * @returns {boolean}
 */
function commandArraysAreEquivalent(settings, packages) {

  if (settings.length !== packages.length) return false;

  return settings.every(setting => packages.some(pcommand => {

    if (pcommand.enablement !== setting.enablement) return false;

    if (pcommand.command !== setting.command || pcommand.title !== setting.title ||
      pcommand.category !== setting.category || pcommand.run !== setting.run) return false;

    return Object.entries(pcommand.args || {}).toString() === Object.entries(setting.args || {}).toString();
  }));
}


/**
 * Are the settings and package.json activationEvents the same?
 *
 * @param {Array<*>} settings - activationEvents constructed from the settings.json 'command aliases'
 * @param {Array<*>} packages - the pre-existing activationEvents from package.json
 * @returns {boolean}
 */
// function activationEventArraysAreEquivalent(settings, packages) {

//   //   "onCommand:command-alias.editor.action.clipboardCutAction.1",

//   if (settings.length !== packages.length) return false;

//   return settings.every(setting => packages.some(pevent => {
//     return (pevent === setting);
//   }));
// }


/**
 * Open a QuickPick of all available commands.
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
 * Add new items (with a <defaultAlias> if necessary) to user settings.
 *
 * @param {Object} newCommands - commands: aliases as selected in the QuickPick
 */
async function updateCommandAliasesSettings(newCommands) {

  // the {} at the end is a default value to return if no value is found
  const currentValue = vscode.workspace.getConfiguration().get('command aliases', {});

  let newValues = {};

  // newCommands = { history.showPrevious: "Alias1", history.showNext: "Alias2" }
  // newCommands = { history.showNext: "Alias2, Alias3, Alias4" }

  for (let [key, value] of Object.entries(newCommands)) {

    // if (!value) value = `<defaultAlias>`;
    value = cleanAliasInput(value);

    newValues = { ...newValues, ...{ [key]: value } };
  }
  const updatedValue = { ...currentValue, ...newValues };

  // vscode.ConfigurationTarget.Global = user settings.json

  await vscode.workspace.getConfiguration().update('command aliases', updatedValue, vscode.ConfigurationTarget.Global)
    .then(() => {
      // fulfillment
    }, reason => {
      if (reason.message === `Unable to write into user settings because the file is dirty. Please save the user settings file first and then try again.`) {
        vscode.window
          .showInformationMessage(`Your settings.json file is dirty.  It must be saved before your changes can be made.
  "Save Settings": settings.json will be opened, saved and we will try to make your alias changes.
  "Open Settings Only": you will go there but your aliases changes will not be made.`,
            { modal: true },
            // three buttons: 'Save Settings', 'Open Settings Only' and 'Cancel' (which is auto-generated)
            ...["Save Settings", "Open Settings Only"])
          .then(async selected => {
            if (selected === "Save Settings") {

              await vscode.commands.executeCommand('workbench.action.openSettingsJson');
              if (vscode.window.activeTextEditor) await vscode.window.activeTextEditor.document.save();
              // try again
              updateCommandAliasesSettings(newCommands);
            }

            else if (selected === "Open Settings Only") {
              await vscode.commands.executeCommand('workbench.action.openSettingsJson');
            }
          });
      }
    });

  // {
  //   name: "Error",
  //   message: "Unable to write into user settings because the file is dirty.
  //             Please save the user settings file first and then try again.",
  // }
}

/**
 * @param {*} value
 */
function cleanAliasInput(value) {

  // strip leading and trailing whitespace/commas from complete list: "    A1, A2    "
  if (value) value = value.replace(/^[,\s]*|[,\s]*$/gm, "");

  // value may be a comma-separated list of aliases withn a string
  // this will also strip leading and trailing whitespace from each alias: " A1  ,   A3   "
  value = value.split(/\s*,\s*/);  // returns an array

  value = value.filter((/** @type {string} */ item) => item.length > 0); // for aliases that end up as empty strings: "A1,,,,A2"

  value = value.length ? value : `<defaultAlias>`;  // if value is now an array with nothing in it, all filtered out

  // don't make an array for only one value : ['Alias1']
  if (value.length === 1 && value !== '<defaultAlias>') value = value[0];

  return value;
}

exports.activate = activate;

// eslint-disable-next-line no-unused-vars
function deactivate() { }


// module.exports = {
// 	activate,
// 	deactivate
// }
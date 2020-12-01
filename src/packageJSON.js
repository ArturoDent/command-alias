const vscode = require('vscode');


/**
 * @description - get 'contributes.commands' from this extension's package.json
 * @returns - an array of this extension's commands {command: "", title: ""} 
 */
exports.getPackageJSONCommands = async function ()  {

  let thisExtension = vscode.extensions.getExtension('ArturoDent.command-alias');
  return thisExtension.packageJSON.contributes.commands;
}
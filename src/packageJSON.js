const { extensions, workspace, Uri, } = require('vscode');
const path = require('path');


/**
 * @description - get 'contributes.commands' from this extension's package.json
 * @returns - an array of this extension's commands {command: "", title: ""} 
 */
exports.getPackageJSON = async function ()  {

  // let thisExtension = extensions.getExtension('ArturoDent.command-alias');
  // return thisExtension.packageJSON.contributes.commands;
  
  const extensionPath = extensions.getExtension('ArturoDent.find-and-transform').extensionPath;
  
  const packageJSONUri = Uri.file(path.join(extensionPath, 'package.json'));
  const packageContents = (await workspace.fs.readFile(packageJSONUri)).toString();
  const packageJSON = JSON.parse(packageContents);

	return packageJSON;
}
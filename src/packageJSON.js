const vscode = require('vscode');
const path = require('path');


/**
 * Get this extension's package.json, read fresh from disk on every call.
 * @returns {Promise<*>}
 */
exports.getPackageJSON = async function () {

  const extension = vscode.extensions.getExtension('ArturoDent.command-alias');
  if (!extension) throw new Error('command-alias extension not found');

  const packageJSONUri = vscode.Uri.file(path.join(extension.extensionPath, 'package.json'));
  const packageBytes = await vscode.workspace.fs.readFile(packageJSONUri);
  const packageContents = Buffer.from(packageBytes).toString('utf8');

  return JSON.parse(packageContents);
};

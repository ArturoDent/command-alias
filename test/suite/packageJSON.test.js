const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Reads the manifest straight off disk (no vscode API needed) so this
// test reflects exactly what would be committed/published, regardless
// of whether an Extension Development Host has run against this
// workspace and rewritten contributes.commands from local settings.

suite('package.json contributes.commands', () => {

  test('contains only the built-in command-alias.createAliases command', () => {
    const packageJSONPath = path.resolve(__dirname, '../../package.json');
    const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
    const commands = packageJSON.contributes.commands;

    assert.strictEqual(commands.length, 1,

      // @ts-expect-error
      `expected exactly 1 contributed command, found ${commands.length}: ${commands.map(c => c.command).join(', ')}`);
    assert.strictEqual(commands[0].command, 'command-alias.createAliases');
  });
});

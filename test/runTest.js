const fs = require('fs');
const os = require('os');
const path = require('path');

const { runTests } = require('vscode-test');

// Companion extensions that Settings_examples.md's behavioral tests exercise
// as the target of an alias (e.g. "jump-and-select.bySymbol"). They aren't
// npm dependencies of this extension - they're copied from your main VS
// Code install into the isolated test profile below so the alias commands
// actually resolve to something instead of failing with "command not found".
const COMPANION_EXTENSION_IDS = [
	'arturodent.find-and-transform',
	'arturodent.insert-last-modified-time',
	'arturodent.jump-and-select',
	'ryuta46.multi-command'
];

/**
 * Copy the latest installed version of each companion extension (by
 * comparing the "-x.y.z" suffix numerically) from the main VS Code
 * extensions folder into the isolated test extensions-dir, skipping any
 * already present there.
 *
 * @param {String} testExtensionsDir
 */
function installCompanionExtensions(testExtensionsDir) {

	const sourceExtensionsDir = path.join(os.homedir(), '.vscode', 'extensions');
	if (!fs.existsSync(sourceExtensionsDir)) return;

	fs.mkdirSync(testExtensionsDir, { recursive: true });
	const installedDirs = fs.readdirSync(sourceExtensionsDir);

	for (const extensionId of COMPANION_EXTENSION_IDS) {

		const matches = installedDirs.filter((/** @type {String} */ name) => name.startsWith(`${ extensionId }-`));
		if (!matches.length) {
			console.warn(`Companion extension not found in ${ sourceExtensionsDir }: ${ extensionId }`);
			continue;
		}

		/** @type {(name: String) => Array<Number>} */
		const versionOf = (name) => name.slice(extensionId.length + 1).split('.').map(Number);

		matches.sort((a, b) => {
			const [aVersion, bVersion] = [versionOf(a), versionOf(b)];
			for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
				if ((aVersion[i] || 0) !== (bVersion[i] || 0)) return (aVersion[i] || 0) - (bVersion[i] || 0);
			}
			return 0;
		});
		const latest = matches[matches.length - 1];

		const destination = path.join(testExtensionsDir, latest);
		if (!fs.existsSync(destination)) {
			fs.cpSync(path.join(sourceExtensionsDir, latest), destination, { recursive: true });
		}
	}
}

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../');

		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// vscode-test's default win32 download platform string ('win32-archive') was
		// retired by update.code.visualstudio.com in favor of an architecture-qualified
		// one; override it so the download doesn't 404 on Windows.
		const platform = process.platform === 'win32' ? 'win32-x64-archive' : undefined;

		// VS Code refuses to launch a CLI test run against the default profile
		// while another instance is already using it ("...only supported if no
		// other instance of Code is running"). Point the test run at its own
		// throwaway profile so `npm test` works even with your main editor open.
		const testExtensionsDir = path.join(os.tmpdir(), 'command-alias-test-extensions');
		installCompanionExtensions(testExtensionsDir);

		const launchArgs = [
			`--user-data-dir=${ path.join(os.tmpdir(), 'command-alias-test-user-data') }`,
			`--extensions-dir=${ testExtensionsDir }`
		];

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath, platform, launchArgs });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();

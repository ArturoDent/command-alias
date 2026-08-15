# Audit: VS Code crash-after-upgrade, disposal/leak review, Problems panel

Date: 2026-08-13

## 1. Primary suspect for "VS Code stops working after upgrading 1.78.2 -> 1.79"

[src/extension.js:97-130](../../src/extension.js#L97-L130) (`loadCommands`) reads the extension
via `vscode.extensions.getExtension('ArturoDent.command-alias')` and, when the user's command
aliases differ from what's in `contributes.commands`, serializes the **entire live
`thisExtension.packageJSON` object** back to the extension's own manifest file on disk:

```js
thisExtension.packageJSON.contributes.commands = settingsPackageCommands;
fs.writeFileSync(path.join(context.extensionPath, 'package.json'),
  JSON.stringify(thisExtension.packageJSON, null, 1));
```

`Extension.packageJSON` is not the raw file - VS Code overlays runtime-only bookkeeping fields
onto it: `id`, `identifier`, `isBuiltin`, `isUserBuiltin`, `isUnderDevelopment`,
`extensionLocation` (a serialized `Uri`), `targetPlatform`, `preRelease`. Writing that enriched
object back to the real `package.json` bakes those fields permanently into the extension
manifest. [package.json](../../package.json) in this working tree is currently in exactly that
corrupted state (see `git diff -- package.json`) - confirming this code path is live and firing.

The developer's own TODO at [src/extension.js:11](../../src/extension.js#L11) even flags it:
`// TODO: is there a way to avoid writing all the junk to the package.json that vscode does?`

Because the pre-existing (committed) `package.json` already carried a stray `"id"` field before
this session's changes, this has likely been silently corrupting the manifest across multiple
past sessions, each publish baking in whatever shape the then-current VS Code version produced.
A minor-version upgrade (1.78.2 -> 1.79) is exactly the kind of change that could alter this
shape (or VS Code's tolerance of it) enough to break manifest loading for an already-corrupted
file - which lines up with the timing users reported.

## 2. Disposal / memory-leak review

- [src/extension.js:8](../../src/extension.js#L8) - module-level `let disposables = [];` is
  pushed to at [line 50](../../src/extension.js#L50),
  [line 83](../../src/extension.js#L83), and [line 173](../../src/extension.js#L173), but is
  never read, disposed, or cleared anywhere (including in `deactivate()`). It's dead weight that
  retains references for the life of the extension host. The file even flags this itself:
  `// get rid of these *** TODO` at [line 48](../../src/extension.js#L48). Not itself the cause
  of "VS Code stops working" (every pushed disposable is *also* correctly pushed to
  `context.subscriptions`, which VS Code disposes automatically on deactivate), but it's a real,
  fixable leak of retained closures.
- [src/extension.js:323](../../src/extension.js#L323) - `deactivate()` is a no-op. This is fine
  per the VS Code API contract (`context.subscriptions` members are auto-disposed), not a bug on
  its own.
- No command un-registration path exists for aliases removed from settings - `loadCommands`
  (called again on every relevant `onDidChangeConfiguration`) only ever adds new command
  registrations ([src/extension.js:158-174](../../src/extension.js#L158-L174)); it never disposes
  a `registerCommand` disposable for an alias the user deleted. This is bounded (the extension
  already tells the user to reload the window after alias changes -
  [src/extension.js:38-44](../../src/extension.js#L38-L44)), so it's a minor, session-scoped leak
  rather than a crash cause.

## 3. Problems panel - 14 unique TypeScript `checkJs` diagnostics (15 reported, 1 duplicate)

These come from [jsconfig.json](../../jsconfig.json)'s `"checkJs": true`, evaluated by VS Code's
bundled TypeScript against [src/extension.js](../../src/extension.js) and
[src/settings.js](../../src/settings.js). All 14 are real, fixable typing issues - none are
related to the `typescript`/`@types/node` version mismatch found separately (see #4).

| # | Location | Code | Message | Root cause |
|---|----------|------|---------|-------------|
| 1 | [extension.js:25](../../src/extension.js#L25) | TS2345 | `string \| undefined` not assignable to `string` | `getCategorySetting()` can return `undefined`; `loadCommands` declares `category` as `String` |
| 2 | [extension.js:36](../../src/extension.js#L36) | TS2345 | same as #1 | same root cause, second call site |
| 3 | [extension.js:182](../../src/extension.js#L182) | TS2314 | `Array<T>` requires 1 type argument | bare `@param {Array}` JSDoc (reported twice by the panel for this line) |
| 4 | [extension.js:183](../../src/extension.js#L183) | TS2314 | same | bare `@param {Array}` JSDoc |
| 5 | [extension.js:73](../../src/extension.js#L73) | TS7053 | string can't index type `{}` | `let newCommands = {}` has no index signature |
| 6 | [extension.js:279](../../src/extension.js#L279) | TS18048 | `activeTextEditor` possibly `undefined` | no guard before `.document.save()` - also a real runtime risk |
| 7 | [extension.js:308](../../src/extension.js#L308) | TS2322 | `string[]` not assignable to `string` | `value` reused for both string and array shapes in `cleanAliasInput` |
| 8 | [extension.js:310](../../src/extension.js#L310) | TS2339 | `.filter` doesn't exist on `string` | cascades from #7 |
| 9 | [extension.js:310](../../src/extension.js#L310) | TS7006 | `item` implicitly `any` | cascades from #7 |
| 10 | [settings.js:68](../../src/settings.js#L68) | TS2488 | `Object` has no iterator | `@param {Object} settings` used in a `for...of` - it's actually an array |
| 11 | [settings.js:81](../../src/settings.js#L81) | TS2339 | `enablement` doesn't exist on inferred `newCommand` type | conditional-branch assignment isn't picked up by evolving-object inference |
| 12 | [settings.js:124](../../src/settings.js#L124) | TS2339 | same as #11 | second occurrence, same pattern |
| 13 | [settings.js:156](../../src/settings.js#L156) | TS2488 | `Object` has no iterator | `@param {Object} settingsCommands` used in a `for...of` - it's actually an array |

## 4. Unrelated tooling issue found during investigation

[package.json:161-166](../../package.json#L161-L166) - devDependency `typescript` is pinned to
`^3.8.3` while `@types/node` was bumped to `^22.12.0`. TypeScript 3.8.3 cannot even parse modern
`@types/node` `.d.ts` syntax, so any local `tsc`/checkJs run floods with hundreds of parse errors
inside `node_modules/@types/node/*.d.ts`. This does **not** affect the live Problems panel (VS
Code uses its own bundled, much newer TypeScript, and no `typescript.tsdk` override is
configured), but it does break local command-line type-checking. User asked for this to be
bundled into the fix.

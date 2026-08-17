# Audit: self-writing `package.json` pattern across ArturoDent's VS Code extensions

Date: 2026-08-15

## Background

`command-alias` was previously found and fixed for a bug class where
`vscode.extensions.getExtension(id).packageJSON` (VS Code's *enriched*, runtime-bookkeeping
object, not the raw file on disk) was serialized directly back onto the extension's own
`package.json`, baking in junk fields like `id`/`identifier`/`extensionLocation`. Full writeup:
[vscode-extensionPath-packageJSON-self-corruption.md](../../../../.claude/reports/vscode-extensionPath-packageJSON-self-corruption.md),
referenced from memory at
[vscode-extension-manifest-pitfall.md](../../../../.claude/projects/c--Users-markm-OneDrive-command-alias/memory/vscode-extension-manifest-pitfall.md).
See also the original crash investigation for this repo:
[vscode-crash-and-diagnostics-audit.md](vscode-crash-and-diagnostics-audit.md).

The user asked whether the same pattern was implemented correctly across every one of their
GitHub projects, pointing at `github.com/search?q=owner:ArturoDent+extensionPath&type=code`.

**Method:** GitHub's code-search UI and the `search/code` REST API both require an authenticated
session (confirmed directly - no `gh` CLI is installed locally, and an unauthenticated
`api.github.com/search/code` request returns 401), so the search URL itself could not be fetched.
Instead, the GitHub profile listing (21 repos) was cross-referenced against local clones - 19 of
the 21 already exist under `C:\Users\markm\OneDrive\` - and every local repo was grepped for
`extensionPath` end to end. The two repos without a local clone (`symbolsTree`,
`custom-html-formatter`) were checked via `raw.githubusercontent.com` instead.

## Repos that self-manage `contributes.*` in their own `package.json`

Three repos actively read-modify-write their own manifest at runtime. All three do it correctly
as of this audit: every write site sources its in-memory `packageJSON` object from a helper that
re-reads the raw file from disk (`vscode.workspace.fs.readFile`), never from the enriched
`Extension.packageJSON`.

| Repo | Write site | Read helper |
| --- | --- | --- |
| command-alias | [src/extension.js](../../src/extension.js) via [src/packageJSON.js](../../src/packageJSON.js) | raw-read, already fixed |
| find-and-transform | [src/registerCommands.js:44-65](../../../../find-and-transform/src/registerCommands.js#L44-L65) | `utilities.getPackageJSON()` - raw-read (this is in fact the canonical example already quoted in the portable report above) |
| decorate-files | [src/extension.ts:50-53](../../../../decorate-files/src/extension.ts#L50-L53), [src/colors.ts:16-31](../../../../decorate-files/src/colors.ts#L16-L31) | [src/utilities.ts:8-17](../../../../decorate-files/src/utilities.ts#L8-L17) - raw-read |

## Problem found: stray corruption field in `find-and-transform/package.json`

[find-and-transform/package.json](../../../../find-and-transform/package.json) had a leftover
top-level `"id": "ArturoDent.find-and-transform"` field at line 2, sitting right next to
`name`/`displayName`/`version`/`publisher` - the exact injected-field signature the pitfall report
warns about, left over from a *past* occurrence of the bug (the current code no longer reproduces
it, but nothing had removed what the old bug already baked in).

`git blame` dated the field to commit `f26779f2` (2026-08-12, Mark Mulhollam), still present in
`HEAD` with a clean working tree at the time of this audit, meaning it shipped in every version
from that commit onward, likely including the currently-published Marketplace release.

**Fixed as part of this audit** - line removed:

```diff
 {
-  "id": "ArturoDent.find-and-transform",
   "name": "find-and-transform",
```

**Follow-up left for the user:** since this was a committed (not just working-tree) corruption, it
may already be in the currently-published Marketplace version of `find-and-transform`. Worth
checking whether a patch release is warranted - that check wasn't done here (no Marketplace API
access used in this audit).

## Safe, read-only usages (not the bug pattern)

These reference `extensionPath` or `.packageJSON`, but only to read *contributed language config*
file paths off `extension.packageJSON.contributes.languages` (their own extension's or another
installed extension's) in order to locate a bundled file. Results are written to a **different**,
derived file - never back to `package.json` itself:

- [find-and-transform/src/getLanguageConfig.js](../../../../find-and-transform/src/getLanguageConfig.js)
- [toggle-comments/src/makeConfigs.js](../../../../toggle-comments/src/makeConfigs.js) (writes a derived `comments.json`)
- [custom-language-properties/src/getLanguageFiles.js](../../../../custom-language-properties/src/getLanguageFiles.js) (writes derived per-language JSON files)
- [custom-language-properties/src/languageConfigs.js](../../../../custom-language-properties/src/languageConfigs.js) (entirely dead/commented-out code)
- [comment-blocks/src/getLanguageConfig.ts](../../../../comment-blocks/src/getLanguageConfig.ts)

## Repos ruled out

**Not locally cloned**, checked via raw GitHub fetch of entry files - neither references
`extensionPath`, `package.json`, or `fs.writeFileSync` anywhere:

- `symbolsTree`
- `custom-html-formatter`

**No reference to `extensionPath` anywhere** (recursive grep across all of `OneDrive` returned
zero hits in each):

- `jump-and-select`
- `repeat-commands`
- `convert-selection`
- `read-only-non-workspace`
- `insert-last-modified-time`
- `problems-copy`
- `close-other-terminals`
- `editor-manager`
- `highlight-files`
- `folder-operations`
- `launch-config`
- `SACC_clean`
- `potooCocha`

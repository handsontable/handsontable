---
type: how-to
title: How to run the migration codemod
metaTitle: How to run the migration codemod | Handsontable DataGrid for JavaScript
description: Run the migration codemod to apply the mechanical part of a Handsontable DataGrid upgrade from 17.x to 18.0 or 18.1, and get a report of the steps it leaves to you.
permalink: /migration-codemod
canonicalUrl: /migration-codemod
tags:
  - codemod
  - migration
  - upgrade
react:
  metaTitle: How to run the migration codemod | Handsontable DataGrid for React
angular:
  metaTitle: How to run the migration codemod | Handsontable DataGrid for Angular
vue:
  metaTitle: How to run the migration codemod | Handsontable DataGrid for Vue
searchCategory: Guides
category: Upgrade and migration
menuTag: new
---

::: warning
The `@handsontable/codemod` package is not on npm yet, so `npx @handsontable/codemod` does not work today. Until the package is published, replace `npx @handsontable/codemod` in the commands on this page with `pnpm dlx "github:handsontable/handsontable#<branch>&path:/codemod"`. Replace `<branch>` with the name of a branch that holds the codemod.
:::

The migration codemod is a command-line tool that applies the mechanical part of a Handsontable DataGrid upgrade to your project. It reports every change that needs your decision.

[[toc]]

## What the codemod does

The codemod reads the files of your project and finds the places an upgrade changes. It handles each place in one of two ways:

- **Rewrite.** When the change is certain, the codemod edits the file. For example, it renames an option, moves an import, or raises a version range in `package.json`.
- **Report.** When the change needs a decision, the codemod leaves the code alone. It adds a line to the report. In some cases it also adds a `TODO(handsontable-codemod <rule>)` comment next to the code.

The codemod has no type information. It reports a spot it cannot confirm instead of rewriting it. A JavaScript file needs a Handsontable import or global before the codemod edits it.

### What the codemod does not do

- It never inserts a sanitizer. Handsontable 18.0 stopped sanitizing HTML. The codemod reports the grids that pass markup to a surface that used to be sanitized, and you choose the sanitizer.
- It never inserts or invents a license key. It reports a grid that sets none.
- It does not rewrite templates or inline scripts. Vue, Angular, and HTML templates, and the inline `<script>` elements of an HTML page, are report-only.
- It does not convert Numbro.js patterns or Moment.js date formats. It reports each pattern that no longer works, because the replacement depends on what the pattern meant.
- It does not format code or install packages. Run your formatter and your package manager afterward.

## Supported migrations and file types

The codemod covers these migrations:

- 17.x to 18.0
- 18.0 to 18.1

Each migration follows one page of the migration guide: [Migrating from 17.1 to 18.0](@/guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0.md) and [Migrating from 18.0 to 18.1](@/guides/upgrade-and-migration/migrating-from-18.0-to-18.1/migrating-from-18.0-to-18.1.md). Every entry in the report links to its guide section.

A project on a version older than 17.0 stops with exit code 2. The message names the earlier migration guides. Follow those guides first, or pass `--allow-uncovered` to run the covered migrations anyway.

The codemod handles these files:

- JavaScript and TypeScript: `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts`.
- Vue single-file components: `.vue`.
- Stylesheets: `.css` and `.scss`.
- HTML pages: `.html` and `.htm` (report only).
- `package.json`.

It skips `node_modules`, `dist`, `build`, `coverage`, `.git`, minified files, and `.d.ts` files.

## Requirements

- Node.js 20 or later.
- A clean git tree. The codemod refuses to run when `git status` shows uncommitted changes, so the migration is one diff that you can review and revert. Pass `--allow-dirty` to run anyway.

## Run the codemod

Run the codemod from the root of your project.

### Preview the changes

A dry run prints a unified diff and the report, and writes no project files:

```bash
npx @handsontable/codemod migrate --from 17.1 --to 18.1 --dry-run
```

`--from` is optional. Without it, the codemod reads the installed version from the nearest `node_modules/handsontable`. If that is missing, it reads the `handsontable` range in the nearest `package.json`. When it cannot find a version, or paths resolve to different versions, it asks for `--from`.

`--to` defaults to the latest migration the codemod knows. A partial version such as `18` means the highest known release of that line.

### Apply the changes

Run the same command without `--dry-run`. Add `--report` to keep the full report in a file:

```bash
npx @handsontable/codemod migrate --from 17.1 --to 18.1 --report migration-report.md
```

Keep the report file out of the git tree, or delete it when you are done.

### Read the report

The console report groups the entries by rule and lists each location as `file:line`. The last line sums up the run: files changed, rewrites applied, manual steps, and warnings. The report also contains these sections:

- **Read once.** Notes that hold for every file appear one time, with the files they apply to.
- **Skipped files.** Files and blocks the codemod did not analyze, such as Less, Stylus, and Sass files. Check them by hand.

The file from `--report` is a Markdown checklist with one checkbox per manual step.

## What the codemod rewrites

For the 17.x to 18.0 migration, the codemod rewrites:

- Imports from `handsontable/common`, and the theme registry names, to the entry points that export them now.
- Renamed plugin types, and `Handsontable.X` namespace types that became named imports.
- `numericFormat.culture` to the `locale` option.
- The removed `correctFormat` and `datePickerConfig` options. Handsontable 18.0 ignores both, so deleting them keeps the behavior. A TODO comment stays where the option was.
- `columnHeaders` to `colHeaders` in the arguments of the export methods.
- The `--ht-wrapper-border-radius` CSS custom property and the `wrapperBorderRadius` theme token.
- Calls to the deprecated resize-state methods, when the call is a whole statement.
- The `handsontable` and wrapper ranges in `package.json`.

For the 18.0 to 18.1 migration, the codemod raises the `handsontable` and wrapper ranges in `package.json`.

## What the codemod only reports

For the 17.x to 18.0 migration, the codemod reports:

- Numbro.js patterns, Moment.js date and time formats, and the packages behind them.
- Grids that pass HTML to a surface that used to be sanitized, and `Handsontable.helper.sanitize()` calls.
- CSS selectors and DOM queries that depend on the old wrapper structure.
- Pikaday leftovers.
- Removed exports and removed namespace types.
- Functions that the 17.x typings declared on `Handsontable.helper` and the runtime never set.

For the 18.0 to 18.1 migration, the codemod reports:

- A grid with no `licenseKey`.
- Sanitizer functions that test the source against `'innerHTML'`.
- Synthetic header events and column move hooks.
- Loading markup.
- Pikaday styles that are left in a theme, a stylesheet, or an HTML page.

The [codemod README](https://github.com/handsontable/handsontable/tree/develop/codemod) lists every rule.

## After the run

1. Run your formatter and your linter on the changed files.
2. Run `tsc` and your tests.
3. Work through the report. Search the code for the markers the codemod left:

   ```bash
   git grep -n "TODO(handsontable-codemod"
   ```

   Each marker names its rule and links to the matching guide section. A step in an HTML page, a template, or `package.json` has no marker, so the report is the only record of it.

4. Delete each comment when you have done what it says. The codemod does not add it again, and a second run changes nothing.

To run the codemod without markers in the code, pass `--no-todo`. The report is then the only record of the manual steps.

To run the migration again, for example after a `git reset`, pass `--from` with your previous version. The codemod raised the `handsontable` range in `package.json`, so without `--from` it reads the new version and finds nothing to migrate.

## Options

| Flag | Meaning |
| --- | --- |
| `--from <version>` | The version your project is on, such as `17`, `17.1`, or `18.0.0`. A partial version means any version of that line. |
| `--to <version>` | The version to migrate to. Defaults to the latest migration the codemod knows. |
| `--dry-run` | Print a unified diff and write no project files. A file named by `--report` is still written. |
| `--report <file>` | Write the full report to `<file>` as a Markdown checklist. |
| `--only <ruleId>` | Run only this rule. Repeat the flag for several rules. A trailing `*` matches a prefix. |
| `--list` | List the rules in the version range and exit. |
| `--aggressive` | Also rewrite settings objects the codemod found with medium confidence. |
| `--no-todo` | Leave no `TODO(handsontable-codemod ...)` comments in the code. |
| `--allow-dirty` | Run even when the git tree has uncommitted changes. |
| `--allow-uncovered` | Run although the project is older than the oldest version the codemod migrates from. |
| `--max-file-size <bytes>` | Skip files larger than this and list them under "Skipped files". The default is 1048576 (1 MB). |

Pass `--help` to see the full list.

## Limitations

- The codemod reads one file at a time. It does not follow a settings object across files.
- It recognizes a settings object by what the file shows. An object it recognizes with high confidence is rewritten. An object it recognizes with medium confidence is reported, and the codemod rewrites it only with `--aggressive`. Read the report of a normal run before you use `--aggressive`.
- It does not rewrite a receiver it cannot confirm as a grid instance or a plugin. It reports or skips the call.
- It reports template code and the inline scripts of an HTML page, and does not rewrite them.
- It does not edit `catalog:` specs, `overrides`, `resolutions`, `pnpm.overrides`, or CDN URLs. It reports the ones that hold Handsontable or a wrapper below the target version.
- A file that does not parse is skipped and reported, and the run exits with code 1.
- When a rewrite adds or removes a key, the codemod reprints that object. A one-line object can spread over several lines, and a trailing comma can go. Run your formatter afterward.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Done. |
| `1` | A file could not be read, parsed, or transformed. The codemod still migrates the other files. |
| `2` | Usage error or refusal: unknown flag or command, dirty git tree, no version to start from, nothing to migrate, or unknown rule id. |

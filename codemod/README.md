# @handsontable/codemod

A migration CLI for Handsontable DataGrid. It applies the mechanical part of an upgrade to your project, and it
reports everything it cannot do for you. The package is private and not published yet.

## What it does

The tool reads the files of your project, finds the places a Handsontable upgrade changes, and handles each one in
one of two ways:

- **Rewrite.** When the change is certain, the tool edits the file. It renames an option, moves an import, or raises
  a version range in `package.json`.
- **Report.** When the change needs a decision, the tool leaves the code alone. It adds a line to the report, and in
  some cases a `TODO(handsontable-codemod <rule id>)` comment next to the code.

The tool never guesses. It has no type information, so a spot it cannot confirm is reported, not rewritten.

### What it does not do

- It never inserts a sanitizer. Handsontable 18.0 stopped sanitizing HTML. The tool reports the grids that pass
  markup to a surface that used to be sanitized, and you choose the sanitizer.
- It never inserts or invents a license key. It reports a grid that sets none.
- It does not rewrite templates. Angular and HTML templates are read-only for the tool. It reports the places that
  need a change.
- It does not convert Numbro.js patterns or Moment.js date formats. It reports each `numericFormat.pattern`,
  `dateFormat`, and `timeFormat` that no longer works, because the replacement depends on what the pattern meant.
- It does not format code. A rewritten object can print on more lines than before. Run your formatter afterwards.

## Requirements

- Node.js 20 or later.
- A clean git tree. The tool refuses to run when `git status` shows uncommitted changes, so the migration is one
  clean diff that you can review and revert. Pass `--allow-dirty` to run anyway. A directory outside a git
  repository has no such check.

## Run it

Run the tool from the root of your project, and review the diff before you commit it.

```bash
# See what would change. Nothing is written.
handsontable-codemod migrate --from 17.1 --to 18.1 --dry-run

# Apply it, and keep the full report in a file.
handsontable-codemod migrate --from 17.1 --to 18.1 --report migration-report.md
```

`--from` is optional. The tool reads the installed version from `node_modules/handsontable`, then the range of
`handsontable` in `package.json`. `--to` defaults to the latest released migration.

### Install from the repository

The package is not on npm yet. Three ways to run it from the repository are candidates. Treat all three as
**UNVERIFIED** until the first push of the branch confirms them. Replace `<branch>` with the branch name.

```bash
# UNVERIFIED: pnpm
pnpm dlx "github:handsontable/handsontable#<branch>&path:/codemod" migrate --from 17.1 --dry-run

# UNVERIFIED: npm 11.10 or later
npx "github:handsontable/handsontable#<branch>::path:codemod" migrate --from 17.1 --dry-run

# UNVERIFIED: a tarball. Run `npm pack` in the codemod directory, then install the file it prints.
npx --package ./handsontable-codemod-0.1.0.tgz handsontable-codemod migrate --from 17.1 --dry-run
```

The form that always works is a local clone:

```bash
git clone https://github.com/handsontable/handsontable.git
pnpm install --dir handsontable
node handsontable/codemod/bin/handsontable-codemod.mjs migrate --from 17.1 --dry-run
```

## Command reference

```bash
handsontable-codemod migrate [paths...] [options]
```

`paths` are files or directories, relative to the current directory. The default is the current directory. The tool
skips `node_modules`, `dist`, `build`, `coverage`, `.git`, minified files, and `.d.ts` files. A file you name on the
command line skips the generated-output filter.

| Flag | Meaning |
|---|---|
| `--from <version>` | Version your project is on: `17`, `17.1`, or `18.0.0`. A partial version means any version of that line. Detected from `node_modules/handsontable`, then from the `package.json` range, when omitted. |
| `--to <version>` | Version to migrate to. A partial version means the highest known release of that line. Defaults to the latest released migration. |
| `--dry-run` | Print a unified diff and write nothing. The git check does not apply. |
| `--allow-dirty` | Run even when the git tree has uncommitted changes. |
| `--report <file>` | Also write the full report to `<file>` as a Markdown checklist. |
| `--only <ruleId>` | Run only this rule. Repeat the flag for several rules. A trailing `*` matches a prefix, for example `--only "18.0.0/type-*"`. |
| `--list` | List the rules in the version range and exit. `rewrite` rules edit code, `report` rules only report. |
| `--aggressive` | Also rewrite settings objects found with medium confidence. |
| `--include-draft` | Run migrations that are still drafts. |
| `--help` | Show the help. |

A migration for version `v` runs when `from < v <= to`. `--from 17` means any 17.x, so it runs every migration from
18.0 on.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Done. |
| 1 | A file could not be read, parsed, or transformed. The other files are still migrated. |
| 2 | Usage error or refusal: unknown flag or command, dirty git tree, no version to start from, nothing to migrate, unknown rule id. |

### Output

The console report groups the entries by rule. Each rule lists up to 10 locations as `file:line`, then the number of
the others. The last line sums up the run: files changed, rewrites applied, manual steps, and warnings. The file
from `--report` has every location, one checkbox per entry, and a link to the migration guide section of each rule.
A rewrite is checked. A manual step is not.

## Supported migrations

Each migration follows one page of the Handsontable migration guide, and each rule links to its section.

| Migration | Rules | Rewrite | Report |
|---|---|---|---|
| 17.x to 18.0 | 99 | 35 | 64 |
| 18.0 to 18.1 | 8 | 1 | 7 |

`npm run test --prefix codemod` fails when these numbers differ from the output of `--list`. A rule is a `rewrite`
rule when its manifest entry says `safe: true`, and a `report` rule otherwise.

| Rule kind | Rewrite | Report | What it covers |
|---|---|---|---|
| `importSource` | 3 | 0 | Named imports that moved to another entry point, such as `handsontable/common`. |
| `exportRename` | 8 | 5 | Type names that changed. The five `report` rules rename to a type with a different shape. |
| `namespaceType` | 14 | 11 | `Handsontable.X` types that became named imports, and the ones that were removed. |
| `exportRemoved` | 0 | 33 | Names that an entry point no longer exports. The import stays and gets a TODO. |
| `optionRename` | 1 | 0 | An option that changed its name. |
| `optionMove` | 1 | 0 | An option that moved, such as `numericFormat.culture` to `locale`. |
| `optionRemove` | 2 | 0 | An option that Handsontable ignores. The tool deletes it and leaves a TODO. |
| `methodRemove` | 1 | 0 | Methods that do nothing now. |
| `methodMove` | 1 | 0 | Methods that moved to a plugin. |
| `callUnwrap` | 0 | 1 | A call that is a pass-through now. The 17.x call did work, so it is reported. |
| `cssVariable` | 1 | 2 | CSS custom properties that were renamed or removed. |
| `themeToken` | 1 | 2 | Theme tokens that were renamed or removed. |
| `detect` | 0 | 12 | Code that needs a decision. It only reports. |
| `dependency` | 3 | 3 | `package.json` ranges, packages to add, and packages to replace or drop. |
| `custom` | 0 | 2 | Checks that a rule file implements in code. Both report. |

### 17.x to 18.0

The tool rewrites:

- Imports from `handsontable/common` and the theme registry names, to `handsontable`, `handsontable/base`, or
  `handsontable/settings`.
- Renamed plugin types, and `Handsontable.X` namespace types that became named imports.
- `numericFormat.culture` to the `locale` option, in option objects, `<HotTable>` props, and `<HotColumn>` props.
- The removed `correctFormat` and `datePickerConfig` options. Handsontable 18.0 ignores both, so deleting them keeps
  the behavior. A TODO comment stays where the option was.
- `columnHeaders` to `colHeaders` in the arguments of the export methods.
- The `--ht-wrapper-border-radius` custom property and the `wrapperBorderRadius` theme token.
- Calls to the removed resize-state methods, when the call is a whole statement. Other calls get a TODO.
- The `handsontable` and wrapper ranges in `package.json`, and a `hyperformula` dependency when the project uses
  formulas.

The tool reports:

- Numbro.js patterns, Moment.js date and time formats, and the packages behind them.
- Grids that pass HTML to a surface that used to be sanitized, and `Handsontable.helper.sanitize()` calls.
- CSS selectors and DOM queries that depend on the old wrapper structure.
- Pikaday leftovers.
- Removed exports, removed namespace types, and the removed wrapper border width and color.
- Type renames that change the shape of the type, such as `SummaryEndpoint`.
- Functions that the 17.x typings declared on `Handsontable.helper` and the runtime never set.

### 18.0 to 18.1

The tool raises the version ranges in `package.json`. It reports a grid with no `licenseKey`, sanitizer functions
that test the source against `'innerHTML'`, synthetic header events, column move hooks, loading markup, and Pikaday
styles that are left in a theme.

## How confidence works

The tool recognizes a Handsontable settings object by what the file shows. An object passed to
`new Handsontable()` or `updateSettings()`, an object in a `settings` prop, an object with a `GridSettings`
annotation, and the `columns`, `cell`, and `cells` below them have high confidence. An object that only looks like
settings, for example a variable with the keys `colHeaders` and `rowHeaders`, has medium confidence.

A rule rewrites an object at high confidence. At medium confidence it reports the key and leaves the object alone.
`--aggressive` lowers the bar to medium for every rule. Use it after you read the report of a normal run.

## After the run

1. Run your formatter and your linter on the changed files.
2. Run `tsc` and your tests.
3. Work through the report. Search the code for the comments the tool left:

   ```bash
   git grep -n "TODO(handsontable-codemod"
   ```

   Each comment names its rule and, for a rule that has a guide section, links to it. The full text of the advice is
   in the report.
4. Delete a comment when you have done what it says. The tool does not add it again, and a second run changes
   nothing.

## Limitations

- The tool reads one file at a time. It does not follow a settings object across files.
- A receiver it cannot confirm as a grid instance is not rewritten. A generic name such as `editor.undo()` is
  silent.
- A `.vue` file is read block by block. `less`, `stylus`, `sass`, and `src=` blocks are not read.
- A file that does not parse is skipped and reported, and the run exits with code 1.
- It handles `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`, `.vue`, `.css`, `.scss`, `.html`, `.htm`,
  and `package.json`.
- It does not install packages. After it edits `package.json`, run your package manager.

## Contributing

Behavior comes from data: one manifest per release in `versions/`, read by generic transforms. To add a rule or a
migration, read [`AGENTS.md`](./AGENTS.md).

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

The tool never guesses. It has no type information, so a spot it cannot confirm is reported, not rewritten. A
JavaScript file needs a Handsontable import or global before the tool edits it. The one exception is a file that names
a `--ht-` CSS variable, which counts as Handsontable usage for the CSS variable rules (see "How confidence works").

### What it does not do

- It never inserts a sanitizer. Handsontable 18.0 stopped sanitizing HTML. The tool reports the grids that pass
  markup to a surface that used to be sanitized, and you choose the sanitizer.
- It never inserts or invents a license key. It reports a grid that sets none.
- It does not rewrite templates or inline scripts. Vue, Angular, and HTML templates are read-only for the tool. It
  reports the `<hot-table>` and `<hot-column>` attributes that set an option a rule targets, and the inline
  `<script>` elements of an HTML page that use Handsontable, because it reads no JavaScript inside a page.
- It does not convert Numbro.js patterns or Moment.js date formats. It reports each `numericFormat.pattern`,
  `dateFormat`, and `timeFormat` that no longer works, because the replacement depends on what the pattern meant.
- It does not format code. A rewritten one-line object or JSX element can print on more lines than before (see
  "Limitations"). Run your formatter afterwards.

## Requirements

- Node.js 20 or later.
- A clean git tree. The tool refuses to run when `git status` shows uncommitted changes, so the migration is one
  clean diff that you can review and revert. Pass `--allow-dirty` to run anyway. An untracked file at the path of
  `--report` does not count, so a report from the previous run does not block the next one. Keep the report out
  of the tree, or delete it when you are done. A directory outside a git repository has no such check, and the tool
  warns before it writes there.

## Run it

Run the tool from the root of your project, and review the diff before you commit it.

```bash
# See what would change. Nothing is written.
handsontable-codemod migrate --from 17.1 --to 18.1 --dry-run

# Apply it, and keep the full report in a file.
handsontable-codemod migrate --from 17.1 --to 18.1 --report migration-report.md
```

`--from` is optional. For each path you name, the tool reads the installed version from the nearest
`node_modules/handsontable`, then the range of `handsontable` in the nearest `package.json`, searching from the
path up to the current directory. Paths that resolve to different versions need `--from`. At a monorepo root where no
`package.json` names `handsontable`, the tool reads the ranges of the packages below it: when they agree it uses that
version and names the files, and when they differ it asks for `--from` and lists the packages. A spec that points at
a source is not a version: `file:`, `link:`, `workspace:`, `portal:`, a git or `github:` spec, a URL, a path, and
`catalog:` are skipped, so the digits in a file name never count. When no package names a version, the tool asks for
`--from`. An `npm:handsontable@^17.1.0` alias still counts. `--to` defaults to the latest released migration.

### Which versions it covers

The tool migrates a project that is on Handsontable 17.0 or later (see "Supported migrations"). A project on an
older version stops with exit code 2 and a message that names the earlier migration guides, for example
`migration-from-16.2-to-17.0`. Follow those guides first. To run the covered migrations anyway, pass
`--allow-uncovered`: the report then starts with the guides of the steps the tool does not cover.

`--to` above the newest migration the tool knows (`--to 19`, `--to 18.2`) is not an error. The tool migrates up to
the newest one, prints "No migration for 19 is known. Migrated up to 18.1.0.", and puts the same line at the top of
the report. The `handsontable` ranges in `package.json` go to that newest known version, never beyond it.

### Install from the repository

The package is not on npm yet. Run it from the repository with pnpm, which installs the `codemod` directory of a
branch on its own. Replace `<branch>` with the branch name. Both forms were checked with pnpm 10.33.

```bash
# Run once without installing
pnpm dlx "github:handsontable/handsontable#<branch>&path:/codemod" migrate --from 17.1 --dry-run

# Or add it to a project
pnpm add -D "github:handsontable/handsontable#<branch>&path:/codemod"
pnpm exec handsontable-codemod migrate --from 17.1 --dry-run
```

npm cannot install the package from the repository. `npm install "github:handsontable/handsontable#<branch>::path:codemod"`
prepares the repository root first and stops at the pnpm `catalog:` protocol (checked with npm 12.2). With npm, use a
tarball: run `npm pack` in the `codemod` directory of a clone, then install the file it prints.

```bash
npx --package ./handsontable-codemod-0.1.0.tgz handsontable-codemod migrate --from 17.1 --dry-run
```

A local clone also works:

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
| `--from <version>` | Version your project is on: `17`, `17.1`, or `18.0.0`. A partial version means any version of that line. Detected for each path argument from the nearest `node_modules/handsontable`, then the nearest `package.json` range, up to the current directory, when omitted. Paths that differ need `--from`. |
| `--to <version>` | Version to migrate to. A partial version means the highest known release of that line. Defaults to the latest released migration. |
| `--dry-run` | Print a unified diff and write no project files. The git check does not apply. A file named by `--report` is still written, because you asked for it. |
| `--allow-dirty` | Run even when the git tree has uncommitted changes. |
| `--report <file>` | Also write the full report to `<file>` as a Markdown checklist. The git check ignores an untracked file at this path and no other. |
| `--only <ruleId>` | Run only this rule. Repeat the flag for several rules. A trailing `*` matches a prefix, for example `--only "18.0.0/type-*"`. |
| `--list` | List the rules in the version range and exit. `rewrite` rules edit code, `report` rules only report. |
| `--aggressive` | Also rewrite settings objects found with medium confidence. |
| `--no-todo` | Leave no `TODO(handsontable-codemod ...)` comments in the code, not for a manual step and not where an option was deleted. The report is then the only record of the manual steps. |
| `--include-draft` | Run migrations that are still drafts. |
| `--allow-uncovered` | Run although the project is older than the oldest version the tool migrates from (see "Which versions it covers"). The report starts with the guides of the steps the tool does not cover. |
| `--max-file-size <bytes>` | Skip files larger than this and list them under "Skipped files". The default is 1048576 (1 MB). |
| `--version` | Print the version of the tool. |
| `-h`, `--help` | Show the help. |

A migration for version `v` runs when `from < v <= to`. `--from 17` means any 17.x, so it runs every migration from
18.0 on.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Done. |
| 1 | A file could not be read, parsed, or transformed. The other files are still migrated. |
| 2 | Usage error or refusal: unknown flag or command, dirty git tree, no version to start from, nothing to migrate, unknown rule id. |

### Output

The console report groups the entries by rule, ordered by version and then by rule id. A message that several
locations share is printed once, and the locations follow it. Each rule lists up to 10 locations as `file:line`, then
the number of the others. A rule that matched many times in one file lists every line number in its one entry. Notes
about the run itself, such as a `--to` above every known migration, come first. Two more sections follow the rules:

- **Read once.** A note that holds for every file, such as "CellValue is now `unknown`", appears one time with the
  files it applies to, not once per file.
- **Skipped files.** Files and blocks the tool did not analyze: Less, Stylus, and Sass files, Vue `<style>` blocks in
  those languages or with `src=`, HTML pages with inline scripts that use Handsontable, and files above
  `--max-file-size`. Check them by hand.

A package whose `handsontable` range is below `--from` is not raised, because the steps from its own version were not
selected. The tool warns once for that `package.json` (also on standard error, with exit code 0) and names the `--from`
to use on the package. Source files under it still get the selected rules.

The last line sums up the run: files changed, rewrites applied, manual steps, and warnings. The file from `--report`
has a title with the versions and the date, then the same line, every location, one checkbox per entry, and a link to
the migration guide section of each rule. The tool refuses a `--report` path that is a symbolic link, a file git
tracks, or a file it migrates. A rewrite is checked. A manual step is not. After the run the tool says how many manual steps have a marker in the code
and how many are in the report only. On a terminal, a long run prints a progress line to the
standard error stream every two seconds.

## Supported migrations

Each migration follows one page of the Handsontable migration guide, and each rule links to its section.

| Migration | Rules | Rewrite | Report |
|---|---|---|---|
| 17.x to 18.0 | 103 | 41 | 62 |
| 18.0 to 18.1 | 8 | 1 | 7 |

`npm run test --prefix codemod` fails when these numbers differ from the output of `--list`. A rule is a `rewrite`
rule when its manifest entry says `safe: true`, and a `report` rule otherwise.

| Rule kind | Rewrite | Report | What it covers |
|---|---|---|---|
| `importSource` | 3 | 0 | Named imports that moved to another entry point, such as `handsontable/common`. |
| `exportRename` | 13 | 0 | Type names that changed. A rename to a type of another shape is applied, and its rule reports one note that says what changed in the shape. |
| `namespaceType` | 15 | 12 | `Handsontable.X` types that became named imports, and the ones that were removed. |
| `exportRemoved` | 0 | 35 | Names that an entry point no longer exports. The import stays and gets a TODO. |
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

- Imports from `handsontable/common`, to `handsontable`, `handsontable/base`, or `handsontable/settings`, and the
  theme registry names (`registerTheme`, `mainTheme`, and the others), to `handsontable/themes`. The 17.x typings
  declared the registry on `handsontable` and `handsontable/base` only, so each moved import says why.
- Renamed plugin types, and `Handsontable.X` namespace types that became named imports. When the successor type has
  another shape, such as `SummaryEndpoint`, the tool still renames and reports one note per run that says what
  changed in the shape.
- `numericFormat.culture` to the `locale` option, in option objects, `<HotTable>` props, and `<HotColumn>` props.
- The removed `correctFormat` and `datePickerConfig` options. Handsontable 18.0 ignores both, so deleting them keeps
  the behavior. A TODO comment stays where the option was.
- `columnHeaders` to `colHeaders` in the arguments of the export methods.
- The `--ht-wrapper-border-radius` custom property and the `wrapperBorderRadius` theme token.
- Calls to the deprecated resize-state methods, which do nothing, when the call is a whole statement. Other calls get a
  TODO.
- The `handsontable` and wrapper ranges in `package.json`, and a `hyperformula` dependency when the project uses
  formulas.

The tool reports:

- Numbro.js patterns, Moment.js date and time formats, and the packages behind them.
- Grids that pass HTML to a surface that used to be sanitized, and `Handsontable.helper.sanitize()` calls.
- CSS selectors and DOM queries that depend on the old wrapper structure.
- Pikaday leftovers.
- Removed exports, removed namespace types, and the removed wrapper border width and color.
- Functions that the 17.x typings declared on `Handsontable.helper` and the runtime never set.

### 18.0 to 18.1

The tool raises the version ranges in `package.json`. A caret, tilde, or exact range whose lowest version is below the
target moves to the target, even when it already admits it (`^18.0.0` becomes `^18.1.0`), because you asked to migrate
to that version. A compound or open range that admits the target (`>=17.1.0 <19`, `*`) stays as it is. It reports a
grid with no `licenseKey`, sanitizer functions
that test the source against `'innerHTML'`, synthetic header events, column move hooks, loading markup, and Pikaday
styles that are left in a theme, in a stylesheet, or in the inline `<style>` of an HTML page. A file that mentions
`pikaday` (a `<link>` to its stylesheet, say) is left alone, because it loads Pikaday itself.

## How confidence works

The tool recognizes a Handsontable settings object by what the file shows. An object passed to
`new Handsontable()` or `updateSettings()`, an object in a `settings` prop, an object with a `GridSettings`
annotation, and the `columns`, `cell`, and `cells` below them have high confidence. So do the objects in the
`columns`, `cell`, and `cells` props of a wrapper component, because a prop of `<HotTable>` is an option like a key of
a settings object: `columns={[{ ... }]}`, `columns={(index) => ({ ... })}`, and `columns={columnDefs}`, where
`columnDefs` is an array in the same file, or a `useMemo(() => [...], [])` call with a single `return`. The object
argument of `setCellMetaObject(row, col, { ... })` on a grid instance the file shows (`const hot = new Handsontable(...)`)
is a cell object with high confidence, like a return of `cells()`.

A `cells` function can also be passed by name, in a settings object or as a prop: `cells={plainCells}`, `cells: fmtCells`,
or `cells={cells}` where `cells` holds `useCallback(() => ({ ... }), [])`. The tool follows the name one hop inside
the file, to a `const` arrow function or function expression, a function declaration, or a `useCallback` or
`React.useCallback` call, the way it follows `columns` to a same-file array. Every object the function returns, on
each side of a conditional (`col === 1 ? { ... } : {}`) too, is a cell object with high confidence. A function declaration
that something assigns to, and a `let` or `var`, may hold another function at run time, so their objects have medium
confidence: the tool reports their keys and rewrites them only under `--aggressive`. An imported function, a
parameter, and a destructured name cannot be read, so they are neither reported nor rewritten. An object that
only looks like settings, for example a variable with the keys `colHeaders` and `rowHeaders`, has medium confidence.

A rule rewrites an object at high confidence. At medium confidence it reports the key and leaves the object alone.
`--aggressive` lowers the bar to medium for every rule. Use it after you read the report of a normal run.

Every rule kind needs a Handsontable import or global in the file, with one exception. `--ht-` is Handsontable's own
CSS variable namespace, so a file that names a `--ht-` variable counts as Handsontable usage for the CSS variable
rules only, as a `.css` file does. In a JavaScript file with no other sign of Handsontable, the tool still renames
`'--ht-wrapper-border-radius'` in a string. It does not touch `numericFormat.culture`, `correctFormat`, or a
`.saveManualColumnWidths()` call there, and it does not report them.

## After the run

1. Run your formatter and your linter on the changed files.
2. Run `tsc` and your tests.
3. Work through the report. Search the code for the markers the tool left:

   ```bash
   git grep -n "TODO(handsontable-codemod"
   ```

   Every manual step in a script, a TypeScript file, a Vue `<script>`, or a stylesheet gets a marker at its line, except
   the notes that hold for the whole run, a grid with no `licenseKey`, and test code that dispatches a synthetic header
   event. Each marker names its rule and, for a rule that has a guide section, links to it. A step in an HTML page, a
   template, or `package.json` has no marker: the report lists it. The full text of the advice is in the report. Pass
   `--no-todo` to run without markers.
4. Delete a comment when you have done what it says. The tool does not add it again, and a second run changes
   nothing.

To run the migration again, for example after a `git reset`, pass `--from` with your previous version. Without it
the tool reads the version from `package.json`, which the run raised, and answers "package.json already names 18.1.0".
`--from 18` means any 18.x release. To migrate from 18.0, pass `--from 18.0`.

## Limitations

- The tool reads one file at a time. It does not follow a settings object across files.
- A receiver it cannot confirm as a grid instance is not rewritten. A generic name such as `editor.undo()` is
  silent. The same holds for a plugin: it rewrites `saveManualColumnWidths()` and `downloadFile({ columnHeaders })`
  only on `hot.getPlugin('<key>')` or a variable the file sets from it, and a call on any other receiver is
  reported or left alone. A call whose receiver or arguments can have effects of their own is kept, with a TODO.
- A JavaScript or TypeScript file with mixed line endings is written in the line ending most of its lines use. The
  value of a string or template literal does not change, because JavaScript reads every line break in a template
  literal as a line feed.
- It never follows a symbolic link, and it never writes a file whose real path is outside the project directory. A
  link goes to "Skipped files".
- It edits `package.json` by text offset, so only the changed values and one added line differ. When it cannot
  find a value in the text in a way that agrees with the parsed file (a repeated key, say), it reports the step
  instead of editing.
- It edits a stylesheet (`.css`, `.scss`, and a Vue `<style>` block) by text offset too, so only the renamed names and
  the inserted `/* TODO(...) */` comments differ: comments, strings, and spacing keep their bytes. A declaration whose
  value holds a comment is reported, not edited.
- A `.vue` file is read block by block. `less`, `stylus`, `sass`, and `src=` blocks are not read. They are listed
  under "Skipped files", and so are Less, Stylus, and Sass files.
- A file that does not parse is skipped and reported, and the run exits with code 1.
- It handles `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, `.cts`, `.vue`, `.css`, `.scss`, `.html`, `.htm`,
  and `package.json`.
- It does not install packages. After it edits `package.json`, run your package manager.
- When a rewrite adds or removes a key, the printer reprints that object: a one-line object can spread over several
  lines, a blank line can appear around a multi-line key, and a trailing comma can go. A removed option leaves its
  TODO above the next property, or the previous one when it was last. Run your formatter afterwards.
- A TODO marker on a one-line array element (an object in `columns`, say) is one added comment line, and the element
  keeps its layout. When only white space and block comments precede the element on its line (`/* fx */ { ... },`),
  the marker goes on a line above that line and the comment stays with the element. When the element is also
  rewritten, is wrapped in parentheses, or spans several lines, the printer reprints it as described above.
- A tab-indented file keeps its tabs: a statement the printer prints again, next to a removed call or a changed
  object, is indented with tabs, and so is every added line. The width of a space indent comes from the file.
- A string or template literal that a rule did not edit keeps its bytes, even when the printer reprints the object
  around it. This matters for a literal that spans lines (a template literal, a string with a line continuation, a
  JSX attribute string), because the white space inside it is part of the value. The tool checks every file it
  prints: it reads the literals of the printed text again and compares them with the ones it meant to write. A
  literal that the printer re-indented is put back as it was. When a literal is lost or cannot be put back, the tool
  reports a `transform-error` and leaves the file alone. A literal that a rule does edit (a `--ht-` variable
  renamed inside a template literal) changes only the renamed name.
- A `cells` function the tool cannot read (see "How confidence works") is not checked. A `cells` function from another
  file, or one handed in as a parameter, may still set removed options, so search for them by hand.
- After a rewrite, a default import can become unused. The tool does not remove an import that may be needed for its side
  effects, so your linter reports it.
- Moving `numericFormat.culture` to `locale` can leave `numericFormat: {}` behind. The tool keeps it on purpose: in
  18.x an empty object formats with the `Intl.NumberFormat` defaults (digit grouping on), while no `numericFormat`
  at all uses a plain format without grouping. Delete the empty object yourself when you want the plain format.
- `export ... from 'handsontable/common'` and dynamic `import('handsontable/common')`, including the ones in JSDoc
  comments, are reported and not rewritten.
- Template code (Vue, Angular, and HTML templates) and the inline scripts of an HTML page are reported and not
  rewritten. A Vue file is read when it names `handsontable` or a `--ht-` variable, or when it uses a `<hot-table>`,
  `<hot-column>`, `<HotTable>`, or `<HotColumn>` tag, so a template-only component with a globally registered
  wrapper is reported too. Any other Vue file is not read at all.
- Assignments such as `column.numericFormat = {...}`, `setCellMeta(row, col, 'correctFormat', ...)` calls, and
  `setCellMetaObject()` calls on a receiver the tool cannot confirm as a grid instance are reported and not rewritten.
- It does not edit `overrides`, `resolutions`, `pnpm.overrides`, `npm:` aliases, or CDN URLs. It reports the ones that
  hold Handsontable or a wrapper below the target version.
- It does not edit a `catalog:` or `catalog:<name>` spec, or `pnpm-workspace.yaml`. The range lives in the catalog, so
  the report says to set it in the `catalog` (or `catalogs.<name>`) section of the nearest `pnpm-workspace.yaml`, not
  in `package.json`, where it would take the package out of the catalog. It reads that file with a line scan for the
  block form, names the current entry, and stays silent when the entry already admits the target. A catalog it cannot
  read (flow style, an anchor) gets the generic text.
- A git tree check needs git. Without it the tool treats the directory as a plain folder.

## Contributing

Behavior comes from data: one manifest per release in `versions/`, read by generic transforms. To add a rule or a
migration, read [`AGENTS.md`](./AGENTS.md).

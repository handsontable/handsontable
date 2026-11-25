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
  clean diff that you can review and revert. Untracked files count, whatever `status.showUntrackedFiles` says in your
  git configuration. A tracked file under the directory that is flagged `assume-unchanged` or `skip-worktree` also
  stops the run, because `git status` never shows an edit to it. Pass `--allow-dirty` to run anyway. An untracked file at the path of
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
path up to the current directory and no further: a `node_modules` in a directory above the project is not read. When
both name a version and the range does not allow the installed one (`^17.1.0` against an installed 18.0.2), the project
is between two versions, and the tool asks for `--from` instead of picking one. Of a range with several alternatives
(`^18 || ^17`) it takes the lowest, and a range with no lower end (`<18.0.0`, `*`, `latest`) names no version, so it
asks for `--from`. Paths that resolve to different versions need `--from`. At a monorepo root where no
`package.json` names `handsontable`, the tool reads the ranges of the packages below it: when they agree it uses that
version and names the files, and when they differ it asks for `--from` and lists the packages. A spec that points at
a source is not a version: `file:`, `link:`, `workspace:`, `portal:`, a git or `github:` spec, a URL, a path, and
`catalog:` are skipped, so the digits in a file name never count. When no package names a version, the tool asks for
`--from`. An `npm:handsontable@^17.1.0` alias still counts. `--to` defaults to the newest released migration, or to the newest draft with `--include-draft`.

### Which versions it covers

The tool migrates a project that is on Handsontable 17.0 or later (see "Supported migrations"). A project on an
older version stops with exit code 2 and a message that names the earlier migration guides, for example
`migration-from-16.2-to-17.0`. Follow those guides first. To run the covered migrations anyway, pass
`--allow-uncovered`: the report then starts with the guides of the steps the tool does not cover.

`--to` above the newest migration the tool knows (`--to 19`, `--to 18.2`) is not an error. The tool migrates up to
the newest one, prints "No migration for 19 is known. Migrated up to 18.1.0.", and puts the same line at the top of
the report. The `handsontable` ranges in `package.json` go to that newest known version, never beyond it. When the
line `--to` names holds only a draft migration and you did not pass `--include-draft`, the line says so instead
("19.0 is a draft migration (19.0.0) and was skipped. The run stops at 18.1.0."). `--only '19.0.0/*'` without the flag
is a usage error that names the draft and `--include-draft`.

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
command line skips the generated-output filter, but not the other rules: a file below `node_modules`, and a file git
ignores, is left alone when you name it, as it is when you name its directory, and the "No files to migrate." note says
why.

Inside a git repository the tool reads the files git lists: tracked files, and untracked files that git does not
ignore. "Ignored" is what git says, so the `.gitignore` files above the project, `.git/info/exclude`, and your global
ignore file count, and the tool agrees with `git status` about which files exist. A submodule or an embedded
repository is listed under "Skipped files" with the advice to run the tool inside it. A project directory that an
outer repository ignores gets no file from git, so the tool walks it instead, says so, and warns that `git diff` will
not show the changes. Outside git the tool walks the directory and also skips every directory that starts with a dot
(`.next`, `.nuxt`, `.output`, `.svelte-kit`, `.angular`, `.cache`, `.turbo`, `.vercel`, `.storybook`) and `out`,
`storybook-static`, `bower_components`, `jspm_packages`, and `_site`, because without ignore rules it cannot tell build
output from source. A skipped directory that holds files the tool would read is listed under "Skipped files" with the
command that includes it (`migrate .storybook`). A directory it cannot read (permission denied) is skipped with
everything below it and listed there with the error code, and the walk goes on, so one locked directory does not stop
the run. The directory the run starts from (a path argument, or the project directory) is different: when it cannot be
read there is nothing to migrate, and the tool exits with code 2 and a sentence that names the path and the reason. A path argument is read in the letter case the file system stores.

A run that finds no file to read is not an error (exit code 0, so a loop over packages goes on), and it does not look
like a run that found nothing to change: the tool prints "No files to migrate." with the reason on standard error and
at the top of the report.

| Flag | Meaning |
|---|---|
| `--from <version>` | Version your project is on: `17`, `17.1`, or `18.0.0`. A partial version means any version of that line. Detected for each path argument from the nearest `node_modules/handsontable`, then the nearest `package.json` range, up to the current directory, when omitted. Paths that differ need `--from`. |
| `--to <version>` | Version to migrate to. A partial version means the highest known release of that line. Defaults to the newest released migration, or to the newest draft with `--include-draft`. |
| `--dry-run` | Print a unified diff and write no project files. The git check does not apply. A file named by `--report` is still written, because you asked for it. |
| `--allow-dirty` | Run even when the git tree has uncommitted changes. |
| `--report <file>` | Also write the full report to `<file>` as a Markdown checklist. The git check ignores an untracked file at this path and no other. File names, source lines, and the tags the tool names (`<style lang="less">`) are written as code, so they render as text. |
| `--only <ruleId>` | Run only this rule. Repeat the flag for several rules. A trailing `*` matches a prefix, for example `--only "18.0.0/type-*"`. |
| `--list` | List the rules in the version range and exit. `rewrite` rules edit code, `report` rules only report. |
| `--aggressive` | Also rewrite settings objects found with medium confidence. |
| `--no-todo` | Leave no `TODO(handsontable-codemod ...)` comments in the code, not for a manual step and not where an option was deleted. The report is then the only record of the manual steps. |
| `--include-draft` | Run migrations that are still drafts. Without `--to`, the run goes up to the newest draft. |
| `--allow-uncovered` | Run although the project is older than the oldest version the tool migrates from (see "Which versions it covers"). The report starts with the guides of the steps the tool does not cover. |
| `--max-file-size <bytes>` | Skip files larger than this and list them under "Skipped files". The default is 1048576 (1 MB). |
| `--version` | Print the version of the tool. |
| `-h`, `--help` | Show the help. |

A migration for version `v` runs when `from < v <= to`. `--from 17` means any 17.x, so it runs every migration from
18.0 on.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Done. A run that finds no file to read is also 0, with "No files to migrate." and the reason. |
| 1 | A file could not be read, parsed, transformed, or written, or the report file could not be written. The other files are still migrated. |
| 2 | Usage error or refusal: unknown flag or command, dirty git tree, no version to start from, nothing to migrate, unknown rule id, a `--report` path that cannot be written. |
| 130 | Stopped with Ctrl-C (SIGINT). See "Stopping a run". |

### Stopping a run

Press Ctrl-C once to stop a run. The tool finishes the file it is on, so no file is left half written, starts no other
file, skips the `package.json` pass, and prints one line on standard error: how many files it had written and how to
undo them. In a git repository that was clean when the run started, run `git checkout -- .` to restore them. After
`--allow-dirty` that command would also discard your own changes, so the line says to review the files with `git diff`
instead, and outside git it says to restore the files from a backup. A dry run writes nothing. The run prints no
report, because it would describe only a part of the project. Press Ctrl-C again to end the process at once.

A reader of standard output that closes early (`migrate --dry-run | head -1`) is not an error: the tool stops writing
output, finishes the run, and exits with the code of the run.

### Output

The console report groups the entries by rule, ordered by version and then by rule id. A message that several
locations share is printed once, and the locations follow it. Each rule lists up to 10 locations as `file:line`, then
the number of the others. A rule that matched many times in one file lists every line number in its one entry. Notes
about the run itself, such as a `--to` above every known migration, come first. Two more sections follow the rules:

- **Read once.** A note that holds for every file, such as "CellValue is now `unknown`", appears one time with the
  files it applies to, not once per file.
- **Skipped files.** Files and blocks the tool did not analyze: Less, Stylus, Sass, and PostCSS (`.pcss`, `.postcss`)
  files, Svelte, Astro, and MDX files, Vue `<style>` blocks in those languages or with `src=`, HTML pages with inline
  scripts that use Handsontable, files that are not valid UTF-8 (the tool reads and writes UTF-8 only, so it leaves
  such a file as it is), files above `--max-file-size`, and files with a line of more than 20,000 characters (a minified
  or generated file costs a full parse and is no source to migrate; a `package.json` is exempt). Check them by hand.

A package whose `handsontable` range is below `--from` is not raised, because the steps from its own version were not
selected. The tool warns once for that `package.json` (also on standard error, with exit code 0) and names the `--from`
to use on the package. Source files under it still get the selected rules.

The last line sums up the run: files changed, rewrites applied, manual steps, and warnings. The file from `--report`
has a title with the versions and the date, then the same line, every location, one checkbox per entry, and a link to
the migration guide section of each rule. The tool refuses a `--report` path that is a symbolic link or sits below
one inside the project directory, one that is spelled outside the project and reaches it through a link, a file git
tracks, a file it migrates (found by what the file system says, so another letter case or a hard link
does not get past the check), an existing file of a type the tool migrates, a path inside a `.git` directory, a
directory, an existing file you cannot write, an existing file whose first line is not the report title
(`# Handsontable migration report`, so the file of a previous run is replaced and any other file is not, inside the
project or outside it), or a file in a directory that does not exist or cannot be written. A link on the part of the path outside the
project directory does not matter (`/tmp` is a link on macOS), and a refusal names the link as you typed it. It checks
the path before it changes any file.
A control character in a file name or a source line (an escape sequence) is printed as `\x1b`, in the console, the
report file, and the diff, so a project cannot rewrite your terminal. The user information of a URL (`//user:TOKEN@host`) is shown as `//***@host` in
the console, the report file, and the `--dry-run` diff, so a dependency spec with a credential never reaches a log.
A diff line that holds such a URL is therefore for reading, not for `git apply`. A rewrite is checked. A manual step is not. After the run the tool says how many manual steps have a marker in the code
and how many are in the report only. On a terminal, a long run prints a progress line to the
standard error stream every two seconds.

## Supported migrations

Each migration follows one page of the Handsontable migration guide, and each rule links to its section.

| Migration | Rules | Rewrite | Report |
|---|---|---|---|
| 17.x to 18.0 | 106 | 41 | 65 |
| 18.0 to 18.1 | 8 | 1 | 7 |

`npm run test --prefix codemod` fails when these numbers differ from the output of `--list`. A rule is a `rewrite`
rule when its manifest entry says `safe: true`, and a `report` rule otherwise.

| Rule kind | Rewrite | Report | What it covers |
|---|---|---|---|
| `importSource` | 3 | 0 | Named imports that moved to another entry point, such as `handsontable/common`. |
| `exportRename` | 13 | 0 | Type names that changed. A rename to a type of another shape is applied, and its rule reports one note that says what changed in the shape. |
| `namespaceType` | 15 | 13 | `Handsontable.X` types that became named imports, and the ones that were removed. |
| `exportRemoved` | 0 | 35 | Names that an entry point no longer exports. The import stays and gets a TODO. |
| `optionRename` | 1 | 0 | An option that changed its name. |
| `optionMove` | 1 | 0 | An option that moved, such as `numericFormat.culture` to `locale`. |
| `optionRemove` | 2 | 0 | An option that Handsontable ignores. The tool deletes it and leaves a TODO. |
| `methodRemove` | 1 | 0 | Methods that do nothing now. |
| `methodMove` | 1 | 0 | Methods that moved to a plugin. |
| `callUnwrap` | 0 | 1 | A call that is a pass-through now. The 17.x call did work, so it is reported. |
| `cssVariable` | 1 | 2 | CSS custom properties that were renamed or removed. |
| `themeToken` | 1 | 2 | Theme tokens that were renamed or removed. |
| `detect` | 0 | 14 | Code that needs a decision. It only reports. |
| `dependency` | 3 | 3 | `package.json` ranges, packages to add, and packages to replace or drop. |
| `custom` | 0 | 2 | Checks that a rule file implements in code. Both report. |

### Draft migrations

A draft migration is one whose guide is still being written. It is not in the table above, a normal run never
selects it, and `--to` defaults to the newest released migration, or to the newest draft with `--include-draft`.
To run it, or to list its rules, pass `--include-draft`. The rules and messages of a draft can change before its release.

The 18.1 to 19.0 migration is a draft:

```bash
handsontable-codemod migrate --from 18.1 --to 19.0 --include-draft --dry-run
handsontable-codemod migrate --list --from 18.1 --to 19.0 --include-draft
```

Its manifest lists the sections of the guide that no rule covers, with the reason, under `notAutomated`. `--list`
prints how many there are on the line before the counts.

The 19.0 draft follows `19.0.0-rc1`, the first release candidate (the `rc` tag on npm): every rewrite was checked
against that package, and the type changes it covers come from the difference between 18.1.2 and `19.0.0-rc1`. The
19.0 scope is frozen, but the draft stays a draft until 19.0 is released as stable. A run writes `^19.0.0` for
`handsontable` and the three wrappers, and no published version satisfies that range yet, because a release
candidate never matches it. Until then, install the candidate with `npm install handsontable@rc`. A run that includes a
draft migration and rewrites a `package.json` prints this advice under its "Next:" lines.

### 17.x to 18.0

The tool rewrites:

- Imports from `handsontable/common`, to `handsontable`, `handsontable/base`, or `handsontable/settings`, and the
  theme registry names (`registerTheme`, `mainTheme`, and the others), to `handsontable/themes`. The 17.x typings
  declared the registry on `handsontable` and `handsontable/base` only, so each moved import says why.
- Renamed plugin types, and `Handsontable.X` namespace types that became named imports. When the successor type has
  another shape, such as `SummaryEndpoint`, the tool still renames and reports one note per run that says what
  changed in the shape.
- `numericFormat.culture` to the `locale` option, on a column or a cell: an element of `columns` or `cell`, an object
  that `cells` returns, a `<HotColumn>` prop. At grid level (a settings object, a `<HotTable>` prop) the tool only
  reports it, because a grid-level `locale` also reaches the date, time, and `intl-*` columns, and text sorting,
  filtering, and search. Set `locale` on the numeric columns, or on the grid if every column should use it. When the
  move leaves a `numericFormat` with no `pattern`, a note says what 17.1 showed: it formatted a culture without a
  pattern with the Numbro pattern `'0'`, which keeps every decimal and groups nothing (1234.56 as 1234,56 for de-DE),
  while 18.0 sends the object to `Intl.NumberFormat`, which groups the digits and keeps three decimals (1.234,56, and
  1234.5678 as 1.234,568). The note names `useGrouping: false` and `maximumFractionDigits: 20`, which keep the 17.1
  output (checked with numbro 2.5.0, the version 17.1 ships). The tool does not write them.
- The removed `correctFormat` and `datePickerConfig` options. The built-in cell types of Handsontable 18.0 ignore
  both, so deleting them keeps the behavior. A TODO comment stays where the option was. The tool keeps the option and
  reports it when custom code may read it (see "How confidence works").
- `columnHeaders` to `colHeaders` in the arguments of the export methods.
- The `--ht-wrapper-border-radius` custom property and the `wrapperBorderRadius` theme token, also in the arguments of
  `Handsontable.themes.registerTheme(...).params(...)`, which is the registry that `handsontable/themes` exports.
- Calls to the deprecated resize-state methods, which do nothing, when the call is a whole statement. Other calls get a
  TODO.
- Calls to the undo methods that 17.0 took off the core instance (`hot.undo()`, `hot.redo()`, `hot.clearUndo()`,
  `hot.isUndoAvailable()`, `hot.isRedoAvailable()`) and `hot.undoRedo` when a member of it is used, on an instance the
  file shows. Core had none of them in 17.x, so such a call threw a `TypeError` there: the move makes it work, and the
  entry says so. A member that code tests (`if (hot.undoRedo)`, `typeof hot.undo`, `'undo' in hot`,
  `hot.undoRedo?.clear()`, `hot.undoRedo == null`, a comparison with `undefined`) was `undefined` on 17.x and answers
  differently now, so the tool reports it and everything that the same function guards, and moves nothing there. A
  comparison that gives the same answer either way (`=== null`, a comparison with a string) is not a test. A `hot.undoRedo` that is stored, passed, or compared was
  `undefined` on 17.x and is reported too.
- The `handsontable` and wrapper ranges in `package.json`, and a `hyperformula` dependency when the project uses
  formulas.

The tool reports:

- Numbro.js patterns, Moment.js date and time formats, a `date` or `time` column that sets no format (17.1 read
  `DD/MM/YYYY` and `h:mm:ss a` by default, 18.0 reads ISO 8601), and the packages behind them.
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
`new Handsontable()` or to `updateSettings()` on a grid instance the file shows (`const hot = new Handsontable(...)`,
`ref.current.hotInstance`), an object in a `settings` prop, an object with a `GridSettings`
annotation, and the `columns`, `cell`, and `cells` below them have high confidence. So do the objects in the
`columns`, `cell`, and `cells` props of a wrapper component, because a prop of `<HotTable>` is an option like a key of
a settings object: `columns={[{ ... }]}`, `columns={(index) => ({ ... })}`, and `columns={columnDefs}`, where
`columnDefs` is an array in the same file, or a `useMemo(() => [...], [])` call with a single `return`. The object
argument of `setCellMetaObject(row, col, { ... })` on a grid instance the file shows (`const hot = new Handsontable(...)`)
is a cell object with high confidence, like a return of `cells()`.

`updateSettings()` is also a method of other libraries, so the receiver decides. A receiver the file does not show
(a parameter, a global, the result of a call) gives medium confidence: the options are reported, and rewritten only
under `--aggressive`. A receiver the file shows to be something else (a local object, an imported form library, a
plugin from `getPlugin()`, `this`) is left alone and not reported: no rule reports an option in the object it takes, at
any depth, and the same goes for `setCellMeta()` and `setCellMetaObject()` on such a receiver.

A `cells` function can also be passed by name, in a settings object or as a prop: `cells={plainCells}`, `cells: fmtCells`,
or `cells={cells}` where `cells` holds `useCallback(() => ({ ... }), [])`. The tool follows the name one hop inside
the file, to a `const` arrow function or function expression, a function declaration, or a `useCallback` or
`React.useCallback` call, the way it follows `columns` to a same-file array. Every object the function returns, on
each side of a conditional (`col === 1 ? { ... } : {}`) too, is a cell object with high confidence. A function declaration
that something assigns to, and a `let` or `var`, may hold another function at run time, so their objects have medium
confidence: the tool reports their keys and rewrites them only under `--aggressive`. An imported function, a
parameter, and a destructured name cannot be read, so they are neither reported nor rewritten. An object that
only looks like settings, for example a variable with the keys `colHeaders` and `rowHeaders`, has medium confidence.

The elements of an array that a type names are column objects with high confidence: `ColumnSettings[]`,
`readonly ColumnSettings[]`, `Array<ColumnSettings>`, and `satisfies` one of them, also as `Handsontable.ColumnSettings`.

A rule rewrites an object at high confidence. At medium confidence it reports the key and leaves the object alone.
`--aggressive` lowers the bar to medium for every rule. Use it after you read the report of a normal run.

An object that a variable holds is edited only when every use of the variable is the grid's own: it goes to
`new Handsontable()`, to `updateSettings()` of a grid the file shows (a receiver the file does not show counts under
`--aggressive`), to a wrapper component, or into another settings object, or the code reads it member by member. Any
other use (an argument of another call, an alias, a return, an export, a component that is not a wrapper) leaves the
object alone, and the report names that use: the other code would lose the key too. The same goes for a variable
that holds a column object, or an array of them, and for a class member. An object that a type names
(`GridSettings`, `ColumnSettings`, also through `satisfies`) is held to that type, so this check does not apply to it.
An object that another object spreads (`{ ...base, locale: 'en-US' }`) is reported, not moved, for a move of a nested
key, and for a rename when the receiver sets the new name or sets the old one after the spread. A removal is not
held by a spread, because the removed option does nothing in the target version.

Some code holds Handsontable options without showing it. The tool does not rewrite it. It reports the options it
would have changed, because a missed option fails silently at run time: an object that sets
`numericFormat: { culture }` in a file that uses Handsontable, and a component the tool does not know as a wrapper
(a re-exported `HotTable` under another name, with `columns`, `data`, and similar props) that sets an option a rule
changes or removes. A DOM tag never counts.

A grid instance, a plugin, or a theme that a variable or a `this` member stands for counts only when every value it
can hold qualifies: the initializer and every later assignment, in any scope. A write of `null` or `undefined` does not count against it. A name that is also set to something
else, set by a destructuring or a `for` head, or declared as a parameter is not rewritten on. A call on it is reported
when it may still be the grid or the plugin. In a class, `this` must be the instance: a `this` inside a function or an
object method is not.

A `this` member is judged by every write of its name in the file, on any object: `wrapper.hot = mock`, a
`wrapper['hot'] = mock`, a key `hot:` of an object literal (so `Object.assign(wrapper, { hot: mock })` too), a field,
getter, or method of that name in any class (a subclass that sets it included), and `Object.defineProperty(x, 'hot',
...)`. One write that is not a grid, or that the file does not show, takes the trust away from every `this.hot` of the
file. A copy of the same member (`other.hot = wrapper.hot`) and a write of `null` or `undefined` do not. A class
whose base class is not in the file counts only through what it assigns itself, or a type it declares. The tool does
not see a write through a computed key on another object (`wrapper[key] = x`), or through `Object.assign(wrapper,
source)` with a source that is not an object literal.

`.hotInstance`, the property the wrappers expose, counts as the grid by its name, unless the file writes a value that is
not a grid, `null`, or `undefined` to a member of that name, or declares a method or accessor of it. A declaration with
no value, `null`, or `undefined` (a Vue `data()` that returns `{ hotInstance: null }`, a class field) is neutral, like
a variable's. The wrappers expose it read-only, so a file that gives it another value is defining something else.

`getPlugin()` is also a method of other objects, so its receiver counts, as it does for `hot.undo()`. A plugin counts
when the receiver is an instance the file shows (`const hot = new Handsontable(...)`, `ref.current.hotInstance`). A
receiver the file shows to be something else (a local object that stands in for the grid, a variable that holds an
instance of a local class, an import, a function) is left alone and not reported, and so is a call on its result. Any
other receiver (a global, a parameter, the result of a call, `this.hot` in a class that never sets it) is reported and
not rewritten, even when it is named `hot`. `--aggressive` does not change this.

An option is also not moved or deleted when custom code may read it. `numericFormat.culture`, `correctFormat`, and
`datePickerConfig` stay where they are, with a report that names the reader, when the object, an enclosing settings
object, or the element sets an `editor`, `renderer`, or `validator` that is not a built-in name (a function, an
identifier, or a string such as `'nwm.signedAmount'`), or a `type` that is not a built-in cell type; when the object has
a spread or a computed key the tool cannot read; when the settings hold a `cells` option, `cell` option, or
`afterGetCellMeta` or `beforeGetCellMeta` hook that sets or may set such an `editor`, `renderer`, `validator`, or `type`
(a function that returns one, a hook that assigns one to the cell meta, or a function the tool cannot see, such as an
import); when the file registers a built-in name again; and when the file reads
the option, in a member read, a destructuring, or an `in` test. A write is not a read: an assignment (`columns[2].correctFormat = true`), `delete`,
a destructuring or `for` head target, and a key in an object literal do not count, while `+=`, `||=`, and `++` read the
value first, so they do. A validator or an editor of your own that reads `correctFormat` or
`datePickerConfig`, or a renderer that reads `culture`, keeps working only if you handle the option and the code
together. This holds under `--aggressive` too. A reader in another file is not seen.

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

   Every manual step in a script, a TypeScript file, a Vue `<script>`, or a stylesheet gets a marker at its line (for code
   in a one-line block `{ a(); hot.undo(); }` that stands among statements, before the first statement of that line),
   except
   the notes that hold for the whole run, a grid with no `licenseKey`, and test code that dispatches a synthetic header
   event. Each marker names its rule and, for a rule that has a guide section, links to it. A step in an HTML page (its
   `<style>` blocks included), in the `<template>` of a Vue file or an inline Angular template, or in `package.json`
   has no marker, because the tool leaves no comment there: the report lists it. The full text of the advice is in the
   report. Pass `--no-todo` to run without markers.
4. Delete a comment when you have done what it says. The tool does not add it again, and a second run changes
   nothing.

To run the migration again, for example after a `git reset`, pass `--from` with your previous version. Without it
the tool reads the version from `package.json`, which the run raised, and answers "package.json already names 18.1.0".
`--from 18` means any 18.x release. To migrate from 18.0, pass `--from 18.0`.

## Limitations

- The tool reads one file at a time. It does not follow a settings object across files.
- The check that another consumer holds an object stops at a function: a `cells` function that a shared settings object
  holds, or the object a function returns, is not followed to the other users of the function. The nested object that
  another consumer receives through a member read (`legacy.use(cfg.columns)`) is not followed either.
- It reads and writes UTF-8. A file with a UTF-8 byte order mark keeps it, in a script, a stylesheet, and a
  `package.json`, and reads past it in a `package.json` above the one it edits, as npm does. A file in another
  encoding is listed under "Skipped files" and is not touched. A `package.json` above that cannot be read as JSON may
  declare `hyperformula`, so the tool does not add it below that file and reports the file instead.
- It runs `git rev-parse`, `git ls-files`, and `git status` in your project, with `core.fsmonitor` off and no pager,
  so the configuration of the repository cannot start a program through those two settings. Git itself still applies
  the repository's clean filters (`filter.<name>.clean` with a `filter=<name>` attribute) when `git status` has to
  compare a file, as it does for any git command there. Run the tool only in a repository you trust.
- It follows a reference one hop inside the file and no further: an identifier or a member read such as `PRESET.chf`
  that a `const` holds, also through `as const`. An import, a parameter, a `let`, and a second hop are not followed. A
  `numericFormat` that comes from such a reference, or from an object that spreads one, is reported with "if it sets
  `culture`", and only in a file that mentions `culture`. A `dateFormat` or `timeFormat` from a reference it cannot
  resolve is reported as coming from a variable. One that resolves to a Moment string is reported like the string.
- A `html-without-sanitizer` check merges a spread of an object literal of the same file (one hop, with no spread of
  its own) into the grid configuration. A spread of anything else, a prop for example, may set `sanitizer`. When the
  settings the tool can read hold markup and none of them sets `sanitizer`, it still reports, and the entry names the
  spread or prop it could not read and asks you to check that one of them sets `sanitizer`. A grid with an unread source
  and no visible markup gets no report. The license key check stays silent for such a grid.
- The pattern of a `numericFormat` map is read when the map is annotated `Record<string, NumericFormatOptions>` (also
  `satisfies`, and `Handsontable.NumericFormatOptions`). A map with no annotation is not.
- A column-move hook is found when its name is a string literal, a `const`, or a member of a `const` object in the
  same file, when the registry is `Handsontable.hooks` or a `const` alias of it, and when the key sits in an object
  annotated `Events` or `Partial<Events>`. A hook name that is computed in any other way, such as one read from
  `Object.entries()` of an untyped object, is not found. `Hooks` is the class of the registry and is not read as a map.
- A selector is matched without the scoping wrappers of component styles (`:deep()`, `:global()`, `::v-deep`,
  `::ng-deep`, `/deep/`, `>>>`). A selector that a Sass mixin or a template literal builds at run time is not read.
- A Sass map key that names a variable (`'wrapper-border-radius': 6px`) is reported in a stylesheet that builds
  variable names with `--ht-#{$name}`. The tool does not rename the key, because it cannot tell what else reads the
  map. A variable name built in JavaScript (`` `--ht-${token}` ``) is not found.
- The line of a report entry inside a multi-line template literal is the line of the variable. Its TODO marker goes on
  the statement that holds the literal, because a comment cannot sit inside the literal.
- Two JSX elements on one line that a rule flags each get their own `{/* TODO(...) */}` marker, in front of each
  element. The report shows the rule once for the line.
- When a chained run holds two migrations that report one spot (a rule and its twin in a later migration), the entry
  keeps the id, the guide link, and the marker of the earlier rule and says what the later rule says. A marker that an
  earlier run wrote keeps the words it has.
- A factory that builds an options object (`const make = () => ({ ... })`, `function make() { return { ... }; }`, a
  method that returns one) is edited only when every use of it is the grid's: `cells: make`, a call whose result goes
  to `new Handsontable()`, or a `cells()` method of an options object. A result that goes to another function, an export
  (`export const make`, `export { make }`, `module.exports.make = make`), a method of an exported object or class, or
  an unknown call that takes the factory (`register(make)`) keeps the object as it is, and the entry names the use.
- A TODO on a statement that stands on one line, that the run did not change, and that starts its line
  (`if (ready) plugin.saveManualColumnWidths();`, a `for`, a `while`, a label, a declaration, an `export`) goes on the line
  above, and the statement stays as it was, byte for byte. So does a TODO on an array element or a property of a
  one-line object. The printer still lays out three kinds of statement when they get a TODO: one that shares its line
  with other code (`{ call(); }`, `function f() { call(); }`, `a(); call();`), a brace-less `if` with an `else`, or a label,
  that spans lines (`if (a) b();` then `else c();` is printed on four lines), and a statement that a rule changed. Run
  your formatter, or add the braces first.
- A receiver it cannot confirm as a grid instance is not rewritten. A name that holds a grid on one path and something
  else on another is not confirmed either, and neither is a `this.x` inside a function, an object method, or a nested
  class, or in a class that assigns members by a computed key. A generic name such as `editor.undo()` is
  silent. The same holds for a plugin: it rewrites `saveManualColumnWidths()` and `downloadFile({ columnHeaders })`
  only on `hot.getPlugin('<key>')` (on an instance the file shows) or a variable the file sets from it, and a call on
  any other receiver is reported or left alone. A call whose receiver or arguments can have effects of their own is kept, with a TODO. An
  optional call (`hot.undo?.()`) is reported, not moved, because the plugin method always exists.
- A JavaScript or TypeScript file with mixed line endings (CRLF, LF, and a lone CR in one file) keeps the ending of
  every line the tool did not change. A line the tool adds or changes gets the ending most lines have. The tool finds
  which line of the file a printed line came from by comparing the text of the lines. When an edit sits next to a line
  that the file repeats (two blank lines, say) and those lines end in different ways, the text cannot say which one is
  left, so the tool does not guess: it leaves that file unchanged and reports a `transform-error`. A file that uses one
  ending, a lone CR included, is written in it.
- It never follows a symbolic link, and it never migrates a file whose real path is outside the project directory. A
  link goes to "Skipped files". The one file it writes by your request is the `--report` target, which may sit outside
  the project (`--report ../report.md`) as long as the checks above accept it.
- It writes a changed file to a temporary file in the same directory and renames it over the original, so a full
  disk or a kill during the write leaves the original whole. Just before the rename it reads the file again, and when
  the text is not the text the tool started from (an editor saved while the tool ran) it keeps what is there and
  reports a `write-error`. The mode of the file stays. A read-only file is refused, and so is a file that became a
  link. The new file has a new inode, so a hard link to the old file keeps the old text. A failed or refused write is
  not counted as a rewrite in the summary.
- It runs the `git` found in the directories of `PATH` by absolute path, and never one in the project directory (on
  Windows a `git.exe` in the project would otherwise run first). When git says that the directory is not a repository,
  it behaves as outside a repository, and so it does when no git is found and no `.git` entry (a directory, or the file
  of a linked work tree or a submodule) stands in the directory or above it. A git that runs and fails for another
  reason (`detected dubious ownership` in a container, a corrupt repository), a git that cannot be started, a "not a
  git repository" answer where a `.git` entry stands in the directory or above it (a corrupt `.git/HEAD`), and no git
  on `PATH` inside a repository, are different: the tool cannot tell a clean tree from a dirty one, so a run that writes stops with exit code 2 and
  says what happened (git's message, or that git was not found). `--allow-dirty` runs without the check, and
  `--dry-run` previews; both read the files without git and say so. It asks git in English (`LC_ALL=C`), so a
  translated message is not read as a failure.
- It edits `package.json` by text offset, so only the changed values and one added line differ. When it cannot
  find a value in the text in a way that agrees with the parsed file (a repeated key, say), it reports the step
  instead of editing.
- It edits a stylesheet (`.css`, `.scss`, and a Vue `<style>` block) by text offset too, so only the renamed names and
  the inserted `/* TODO(...) */` comments differ: comments, strings, and spacing keep their bytes. A declaration whose
  value holds a comment is reported, not edited.
- A `.vue` file is read block by block. `less`, `stylus`, `sass`, and `src=` blocks are not read. They are listed
  under "Skipped files", and so are Less, Stylus, Sass, PostCSS, Svelte, Astro, and MDX files that name Handsontable or
  a theme variable.
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
- A shebang line, a byte order mark, and the comments and directives before the first statement (a license header,
  `// @ts-check`, `'use client'`) stay where they are when a rule prints the first statement again. The tool compares
  the printed file with the source, and when a comment or a directive of that start is lost or reordered it leaves the
  file unchanged and reports a `transform-error`. A comment the tool adds goes after them, or above a directive for the
  next line (`// eslint-disable-next-line`, `// @ts-expect-error`, `// prettier-ignore`), which keeps its line.
- A removed call that is a whole statement is cut out of the text, so the statements around it keep their lines, their
  blank lines, and their spaces. Its line goes with it when it stood alone. When it shared a line, it goes with the run of
  spaces that set it apart (`a(); call(); b();` becomes `a(); b();`). Its comments stay where they stood, so a block that
  held nothing else is left with its two braces on lines of their own, and a blank line around the statement stays. When
  another change makes the printer lay out the same list again (an import split in two, say), the printer puts two
  statements that shared a line on lines of their own.
- When an import goes away because it was merged into another, it is cut out of the text like a removed statement:
  the statements around it keep their bytes, blank lines, comments, and the style of their semicolons, and statements
  that shared its line stay as written (`a(); import x from 'y'; b();` becomes `a(); b();`). The comments of the removed
  import (a line above it, a trailing note, a JSDoc block) move to the import that took its name. When another change
  makes the printer lay out the same list again (an import split in two, say), the printer puts two statements that
  shared a line on lines of their own.
- A wildcard re-export (`export * from 'handsontable/plugins/columnSorting'`, `export * as ns from ...`) of a module
  whose names a rule renames or removes gets one entry per rule: every file that imports from the barrel gets the new
  names. The files that import from the barrel are not read. A JSDoc type (`@param {Config}`) that still says the
  old name after an import rename is reported, not edited, because the tool never edits a comment.
- The tool reads one `package.json` above a folder of the run only for its note: `migrate src --to 18.0` migrates the files
  under `src`, names the `package.json` above it that still asks for an older version, and does not edit it.
- An Angular inline template (the `template` of `@Component`) is read like an `.html` page: its options are reported
  and nothing in it is edited. A template with an expression (`${}`) is read with the expressions as spaces, so a
  reported line after a multi-line expression can be off. A template that another module builds is not read.
- A `--ht-` name inside `url()`, a quoted string, or outside `var()` in a stylesheet value is reported and not renamed.
  The variable definition and every `var(--ht-...)` are renamed.
- In a run that crosses a migration and the one after it, a spot that both report is reported once, under the earlier
  migration, with one TODO. When you run the later migration over code the earlier one marked, the spot is reported
  again and no second TODO is added.
- A key that a spread follows is not renamed or moved, because the spread can set it again and win
  (`{ columnHeaders: false, ...opts }`). A key after the spread is.
- A `--ht-` string that is the key of an object that is not a style (`cssVars['--ht-wrapper-border-radius']`, a map of
  your own) is reported and not renamed, because the code that reads the map is not in sight. The keys of a `style`
  prop, of an object named for styles, and of `el.style[...]` are renamed, and so is every string that is not a key.
- A `date` or `time` column with no format is found in script code, not in a template, and only when no spread of
  something the tool cannot read could set the format.
- A TODO next to a JSX element never changes the text the JSX renders: the printer's trimming of white space and decoding
  of entities is undone for every text that is not blank. A text it cannot match to its source makes the tool leave
  the file alone with a `transform-error`.
- `hyperformula` is not added to a package when a `package.json` above it declares it at a range that does not allow
  `^3.0.0`. The report names that file, which the tool does not edit.
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
  hold Handsontable or a wrapper below the target version, and the ones that install it from a git repository or a URL,
  as it does for a dependency with such a spec.
- It does not edit `peerDependencies`. A peer range is the contract of a package with its consumers, and raising it
  drops the older versions for every one of them, so the report names the range and says how to widen it. A peer range
  that already allows the target gets no entry.
- It does not edit a `catalog:` or `catalog:<name>` spec, or `pnpm-workspace.yaml`. The range lives in the catalog, so
  the report says to set it in the `catalog` (or `catalogs.<name>`) section of the nearest `pnpm-workspace.yaml`, not
  in `package.json`, where it would take the package out of the catalog. It reads that file with a line scan for the
  block form, names the current entry, and stays silent when the entry already admits the target. A catalog it cannot
  read (flow style, an anchor) gets the generic text.
- A git tree check needs git. Without it the tool treats the directory as a plain folder.

## Contributing

Behavior comes from data: one manifest per release in `versions/`, read by generic transforms. To add a rule or a
migration, read [`AGENTS.md`](./AGENTS.md).

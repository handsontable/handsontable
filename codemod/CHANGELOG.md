# Changelog

All notable changes to `@handsontable/codemod` are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) on its own: its version is not the Handsontable version.
One release of the tool covers several Handsontable migrations, listed under "Supported migrations" in the README.

How versions are chosen:

- **Patch**: a fix to a rule, a message, or the printer that changes no rule from report to rewrite.
- **Minor**: a new migration (a new `versions/<semver>/` manifest), a new rule, a new flag, or a rule that starts to
  rewrite what it only reported.
- **Major**: a removed or renamed flag, a changed exit code, or a rule that stops rewriting.

## [Unreleased]

### Added

- Two rules of the 17.x to 18.0 migration, `18.0.0/date-default-format` and `18.0.0/time-default-format`: a `date` or
  `time` column with no `dateFormat` or `timeFormat` is reported, because 17.1 read `DD/MM/YYYY` and `h:mm:ss a` by
  default and 18.0 reads ISO 8601. A format set on the grid or on a wrapper element above the column counts.
- Three rules of the 19.0 draft: a hook set to `null`, the frozen column drag with the unfreeze hooks, and an
  `updateSettings()` call in a file with a `dataProvider`. The `notAutomated` reasons of the draft say what the tool does.
- An inline Angular template (the `template` property of `@Component`) is read like an `.html` page, report only, with
  the lines of the `.ts` file. Before, `[correctFormat]` there was not reported while the `styles` of the same component
  were rewritten.
- A rule can name the rules of earlier migrations that report the same spot (`twins`). In a run that holds both, the
  earliest reports the spot once and leaves the one marker, and a later migration leaves no second marker on code the
  earlier one marked. The 19.0 `resize-state-methods`, `helper-sanitize`, and `export-column-headers` use it.
- The 18.1 to 19.0 migration, as a draft: it runs only with `--include-draft` and its rules can change before the
  release of Handsontable 19.0.
- A `notAutomated` list in a manifest for the changes that have no rule. `--list` prints how many there are.
- Detect rules read the quoted values of a part (`regex` with `in: "strings"`), code without comments (`regex` with
  `code: true`), `registerPlugin()` calls by what the file imports (`pluginRegistration`), menu items (`property`
  with `in: "menu-item"`), and `true`, `false`, and `null` attributes of a template (`valueIs`). A rule with
  `requires: "none"` can name a `precheck` that lets a file through that never says Handsontable.
- A `manual` entry for a `handsontable` or wrapper dependency that installs from a repository or a URL
  (`github:`, `git+https:`, `https:`, `owner/repo`), because the tool cannot tell its version.
- A manual entry for an export call that passes a same-file `const` object that sets `columnHeaders` (the 18.0 and
  19.0 rules), naming the variable.
- Reports for `Handsontable.helper.sanitize` read through a destructured helper (`const { helper } = Handsontable`),
  and for an exported alias or reference of the function.

### Fixed

- A `--ht-` name in a `url()`, a quoted string, or outside `var()` in a stylesheet value is no longer renamed, and gets
  a `manual` entry: `url(--ht-wrapper-border-radius.png)` is a file name. The definition of the variable and `var()`
  references are renamed as before.
- A second run no longer adds a TODO above the property of an object argument that the first run reprinted over lines
  (`hot.updateSettings({ numericFormat: { culture }, datePickerConfig: cfg() })`). A TODO that `ctx.todo()` leaves
  now looks above its target too.
- A name counts as a grid instance, a plugin, or a theme only when every value it can hold qualifies. Before, one
  assignment of a plugin made a variable the plugin everywhere, so a variable that was later set to another object
  lost its `saveManualColumnWidths()` call, and one `new Handsontable()` made `widget.undo()` a plugin call. A name set
  by a destructuring, a `for` head, a compound assignment, or a parameter, a name shadowed by a `var` in a namespace or
  a static block, and a `this.x` read inside a function, an object method, or a nested class are not receivers. The
  same history decides which object a variable stands for.
- `hyperformula` is not added to a package when a `package.json` above it declares a range that does not allow the new
  one: the tool reports it and names that file.
- `correctFormat` and `datePickerConfig` stay in code that may read them (a custom editor, renderer, or validator,
  an unreadable spread, a read of the option in the file) and are reported, where they were deleted. The same check
  now guards `numericFormat.culture`, and it knows `editor`, `validator`, `type`, and the registration of a built-in
  name. The Pikaday and Moment.js recipes of the docs are no longer broken by a run.
- A TODO next to a JSX element no longer changes the text the element renders (the space after `{count}`, an entity),
  and two TODOs on one element no longer multiply on every run. A TODO on a one-line array element no longer gets a
  second comment in the next run.
- A `--ht-` string that is the key of a map of your own is reported and not renamed. An optional call
  (`hot.undo?.()`) is reported and not moved. A key that a later spread can set again is reported and not renamed or
  moved. A `const` object that the file changes is no longer read as certainly lacking a key.
- A type reference in `import('./mine').Config`, a Flow object type key, and the parameter patterns of a function type
  are no longer renamed with an import. `export { type Config }` keeps its `type`. A `var` is hoisted out of a
  namespace body and a static block.
- `ssh://`, scp-style, and Windows path specs in `package.json` are sources, not versions. A range with a prerelease on
  its upper or exact bound is reported and not kept.
- The advice of `18.0.0/resize-state-methods` names `colWidths`, not `columnWidths`.
- A detect rule no longer matches the TODO comment the tool wrote, which repeated the guide link and the first
  sentence of the rule: the second run reported the key of the license check again and, in JSX, added a second
  comment. The license key check now reads the string whose whole value is the key, not a URL or a sentence that holds
  it, and reads a file that never says Handsontable.
- `19.0.0/loading-without-dialog` follows the imports of `Loading` and `Dialog`, so a renamed import is read.
- `19.0.0/editor-set-value` and the `srSP` check ignore a comment, `19.0.0/checked-menu-item-property` reports only a
  menu item, and `19.0.0/dropdown-strict-false` reads Vue and Angular templates.
- `getPlugin('ExportFile')` and `getPlugin('exportFile')` name the same plugin for every rule that needs a plugin
  receiver, as in Handsontable.
- `--to 19.0` without `--include-draft` says that 19.0 is a draft that was skipped, not that no migration is known.
  `--only '19.0.0/*'` without the flag names the draft. `--to` and `--include-draft` say in `--help` and in the README
  that the flag moves the default `--to` to the newest draft.
- The note about a pin in `resolutions` says "resolutions", not "overrides".
- The TODO of `19.0.0/resize-state-methods` on a call it keeps names the method.
- A second run adds no second TODO to a call that shared a line with other code inside a function, a method, or an
  object (`mounted() { this.hot = new Handsontable(...); this.hot.undo(); }`). The first run spreads the object over
  lines, and the second run now finds the comment the first run put above the enclosing statement.
- A file that is not valid UTF-8 is skipped with a `skipped-file` warning and keeps its bytes. Before, a rule that
  edited it replaced every byte it could not decode with U+FFFD. A UTF-8 byte order mark still stays in a file.
- A `package.json` with a byte order mark gets its bumps, and the mark stays. Before, the file failed to parse.
- A file the tool cannot write is a `write-error` warning with exit code 1, and the summary does not count it as
  changed. Before, the run stopped with a stack trace.
- A URL in a dependency spec shows `//***@` for its user information in the console, the report file, the `--dry-run`
  diff, and the messages on standard error. Before, `git+https://user:TOKEN@host/repo.git` was printed as written.
- `--report` with a directory that does not exist, or that is not writable, or a path that is a directory, is a usage
  error before any file changes. Before, the files were migrated and the run ended with a stack trace. A report that
  cannot be written after the run is one line on standard error, with exit code 1, after the summary.
- The git commands of the tool run with `core.fsmonitor` off and with no pager, so the configuration of a project
  cannot make `--dry-run` run a program. The README says that a clean filter still runs in `git status`.
- A page with many unclosed `<script>` tags, and a file with many unclosed `/* TODO(handsontable-codemod` comments,
  takes linear time. Before, 1 MiB of either took a minute or more.
- The guide anchors of two `notAutomated` entries of the 19.0 draft (the Cmd/Ctrl rows) are the ids of the built
  site, and the test helper slugs a heading with inline tags and a double hyphen the way the site does.

## [0.1.0] – not published

### Added

- The `handsontable-codemod migrate` command, with `--from`, `--to`, `--dry-run`, `--report`, `--only`, `--list`,
  `--aggressive`, `--no-todo`, `--include-draft`, `--allow-dirty`, `--allow-uncovered`, and `--max-file-size`.
- The 17.x to 18.0 migration and the 18.0 to 18.1 migration.
- Support for JavaScript, TypeScript, JSX, TSX, Vue single-file components, CSS, SCSS, HTML templates (report only),
  and `package.json`.

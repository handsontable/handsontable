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

- `19.0.0/sr-sp-language-script` reports the `<script src>` of a page that loads a published `sr-SP` language file (the
  `dist` file from a CDN or `node_modules`, with or without `.min`, with a query string or a fragment, and with an
  unquoted `src=`). A `<script>` inside an HTML comment is not reported.
- `19.0.0/sr-sp-language-attribute` reports `language="sr-SP"` on a `<hot-table>` or `<HotTable>` element of a Vue, an
  Angular, or an HTML template, also the bound forms `:language="'sr-SP'"` and `[language]="'sr-SP'"`.
- `19.0.0/sr-sp-language-code` also reads `export * from`, `export { default } from`, and `export { x } from` of a module
  of the package (a file that only re-exports the language file is a Handsontable file now), and a TypeScript
  `import x = require('handsontable/languages/sr-SP')`.
- The `counts` of `--json` has `notes`, the number of notes for the whole run, and the summary line adds `N notes to read
  once` when there are any. The `Next:` lines point at them.
- A `.browserslistrc` that the tool cannot use (a link, a directory, a file above `--max-file-size`, a file that is not
  UTF-8, a file with no permission to read) is a `skipped-file` warning that names the file and the reason, as for any
  other file the tool skips.
- A file that could not be written prints its warning and `N files could not be written` on standard error, and the
  `error` of the `--json` document says so. A crash after files were written still prints a document, with the files
  written and the message of what was thrown, also when it was not an `Error`.
- A `detect` `regex` with `code: true` also reads a template or a page without its HTML comments.
- `unmarked` on a `detect` rule: what the rule reports, and with which severity, in a stylesheet that has no mark of
  Handsontable. The manifest loader checks it.

- `--json` prints one JSON document on standard output and nothing else, for a run, `--dry-run`, `--list`, and a usage
  error or a refusal (`schemaVersion` 1). The document holds the counts, the changed files, every report entry, the
  changes of the guides that no rule covers, the skipped files, the notes, and, in a dry run, the diff of each file. The
  notes and warnings stay on standard error, and the exit codes do not change.
- A fourth severity, `review`, next to `changed`, `manual`, and `warning`. A `manual` entry is code that stops working,
  throws, is removed, or is deprecated. A `review` entry is a spot where the behavior changed and the code may already be
  right. The console report lists them in a group of their own, "To review", after the manual steps. The Markdown report
  has a section of its own for them, the summary line says "N to review", and `Next:` has a line for them. A rule that
  only reports sets `severity` to `review` in its manifest entry (`detect` rules already had the field). 28 rules of the
  18.0, 18.1, and 19.0 manifests are `review`, and the notes of the type renames that change the shape of a type are
  `review` as well. The marker in the code reads the same for both.
- `--fail-on-manual` ends a run with exit code 3 when at least one manual step is left. A spot to review and a warning
  never cause it, and code 1 wins over it.
- `19.0.0/browserslist-targets`, a `dependency` rule with a `browserslist` field that holds the minimum browsers of the
  release in the manifest. It reports the `browserslist` key of a `package.json` that declares Handsontable or a wrapper,
  and the `.browserslistrc` next to it, when a query targets a version below the minimum, and lists the queries it cannot
  judge (`defaults`, `last 2 versions`, `> 0.5%`, `extends`) as a spot to review. It never edits a configuration. The
  change is no longer in the `notAutomated` list.
- Three rules of the 19.0 draft: `19.0.0/height-auto`, `19.0.0/sizes-physical-index` (an array or a function as
  `colWidths`, `rowHeights`, or `minRowHeights`), and `19.0.0/get-copyable-source-data`. All three are `review`. The
  physical-index change is no longer in the `notAutomated` list.
- `18.0.0/wrapper-dom-selectors` also reports a position-based walk of the old structure
  (`querySelector('.ht-grid').firstElementChild`, `.firstChild`, and `.children`).

- A manifest of a draft migration may leave out `guide` until its guide page exists, and a draft with no rules is
  valid. A released manifest still needs `guide`, and a rule or a `notAutomated` item of a manifest with no `guide`
  cannot name a guide anchor (the loader says so). `--list` and a run say "has no rules yet" for a selected migration
  with no rule.
- `versions/19.1.0/`, a draft migration from 19.0 with no rules and no guide. It is the place for the rules of changes
  that ship after 19.0 and holds the name `19.1.0` until the version of that release is decided. A manifest with no
  rules is never the end of a run: a default run ignores it, `--include-draft` stops at the newest migration with rules,
  and only an explicit `--to 19.1 --include-draft` selects it, when it changes and reports nothing.
- A draft manifest may set `published: true` when its packages are on npm. The 19.0 manifest did until its release.
- The package carries the repository's `LICENSE.txt`, and its `license` field points at it.
- `detect` `call` matchers take `receiver: "grid"`: a confirmed grid instance, or a receiver the file does not show,
  never one it shows to be another object. `19.0.0/update-settings-data-provider` uses it, so an `updateSettings()` call
  on a local object, an imported library, or a plugin is no longer reported because the file sets `dataProvider`.

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
- The 18.1 to 19.0 migration (`versions/19.0.0/`, 44 rules: 6 rewrite and 38 report). It follows the released
  Handsontable 19.0.0 and its migration guide, and a default run reaches it with no flag.
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

- Two rules: `19.0.0/update-settings-data-schema` and `18.0.0/ns-languages-types`. The 18.0 manifest lists
  `Handsontable.version` as `string | undefined` under `notAutomated`. The reason of `18.0.0/type-dataprovider-options`
  names why the type is renamed. The 17.1 to 18.0 guide has a section on importing
  the theme functions from `handsontable/themes`, which the two theme registry rules link.

### Changed

- The 19.0 migration is released: `versions/19.0.0/` has `status: "released"` and no `published` flag, its `guide`
  anchors and the snapshot of the guide headings were checked against the guide in the repository and the live page, and
  `--to` defaults to 19.0.0 with no `--include-draft`. `19.1.0` stays the empty draft. The README lists 18.1 to 19.0 under
  "Supported migrations", and its "Draft migrations" section names 19.1.0 only.
- A note for the whole run (`scope: "run"`, the note of a type rename) is counted as a note, not as a spot to review, in
  the summary line, the `Next:` lines, the Markdown report, and the `--json` counts. It stays under "Read once" and never
  causes exit code 3 with `--fail-on-manual`.
- `--include-draft` without `--to` stops at the newest migration that has rules. The empty draft `19.1.0` is not the end
  of a run any more: the report title and the `to` of the document say `19.0.0`, "Migrated up to" names it, and "Nothing to
  migrate" lists the draft as `(draft, no rules yet)`.
- `--only` with the pattern of a draft migration that has rules, with no `--include-draft`, names the draft and the
  flag, from the line before it and from the line it starts from alike.
- A nested rule (`.a { &::before {} }`, in SCSS or in native CSS nesting) is read as its resolved selector by every
  `selector` matcher, at the line of the nested rule. `19.0.0/icon-pseudo-element-selectors` reports it.
- The `<style>` elements of an HTML page are read as stylesheets, so each rule of a page gets its own line, and a page
  with no mark of Handsontable and a `.changeType::before` rule gets a `review` entry, as a stylesheet does, when a
  `package.json` in its directory or above it declares `handsontable` or a wrapper.
- A Vue file that uses `<hot-table>` or `<HotTable>`, or imports Handsontable, counts every `<style>` block as marked. Any
  other Vue file judges each block by itself, and reads a block with only a common class name.
- `18.0.0/wrapper-dom-selectors` also reports `?.`, `!.`, and a parenthesized `as` cast after the selector call.
- A Browserslist query is judged with whole numbers: `safari > 18` and `ios_saf > 18` are below the minimum (they select
  18.1), and `chrome > 129.5` is not. A query that can only name a browser with no minimum (`op_mini all`, `dead`,
  `maintained node versions`, `current node`) is not listed. A message names each query once, and at most 10.
- The Markdown report quotes the query you wrote, not the same letters inside the minimums (`Safari 18` inside
  `Safari 18.2`).
- The `manifest.schema.json` accepts `severity: "warning"` for a `detect` rule only, as the loader does.
- A file name is spelled the same way in every output: a line break in it is `\x0a` in the console, the Markdown report, and
  the `--json` document.
- `--json=1` (a flag that takes no value) is a usage error that says the flag takes no value, and the error comes as the
  `--json` document, as does the one of `--list=1`: a token that starts with `--json=` or `--list=` counts as the flag.
  A usage error of a command that has `--list` gets the document of `--list`.
- The note of a type rename that changes the shape of the type (`SummaryEndpoint`, `CellValue`, and the others that
  say it in a `note`) is a `review` entry now. The rename is applied, and the note asks you to look at the shape. With
  `--fail-on-manual` it does not cause exit code 3.
- The summary line of the console and Markdown reports ends with "N to review" before the warnings.
- The 19.0 draft follows the released Handsontable 19.0.0. The `guide` anchors of its rules and the `notAutomated`
  entries follow the released migration guide (changes grouped under six headings, with numbered `###` changes), the
  entries for the merged sections are merged (`HTML output changes for TrustedHTML paste, toHTML() headers, and
  character references`, and `colWidths, rowHeights, and minRowHeights address columns and rows by physical index`),
  and `19.0.0/sr-sp-language-code` and `19.0.0/auto-row-size-use-headers` link their sections. The exports diff is made
  from the published packages `handsontable` 18.1.3 and 19.0.0, with the three wrappers. The removed names are the same
  as in the diff against `19.0.0-rc1`.
- The "Next:" note about release candidates is printed only for a draft whose packages are not on npm yet
  (`published` is not set) and whose rules bump or add a package, and it names the range of that draft. A run from 18.1
  with `--include-draft` no longer says that `^19.0.0` or `^19.1.0` matches no published version.
- The 19.0 draft followed `19.0.0-rc1`. Its exports diff is made from `handsontable` 18.1.2 and `19.0.0-rc1` (the
  three wrappers too), where it compared 18.1.2 with the `experimental` build. The lists of removed exports and removed
  namespace members are the same, and the new type `AppliedCellChange` is the one added name. The `notAutomated` list
  gained the section "A change that waits for its validator stays on its record", and the snapshot of the guide
  headings holds the sections up to 62.
- The test diagnostic that counts the headings of the live 19.0 guide missing from the snapshot compares every heading
  level with the snapshot, and no longer lists the `Who is affected` and `How to migrate` subsections as new.

- `peerDependencies` is no longer rewritten. A peer range below the target gets one `manual` entry that says how to
  widen it, because raising it drops the older versions for every consumer of the package, and a range that already
  allows the target gets none. An `overrides`, `resolutions`, or `pnpm.overrides` entry that installs Handsontable
  from a git repository or a URL gets an entry, as the same spec in `dependencies` does.
- `18.0.0/numeric-format-culture` moves `numericFormat.culture` to `locale` only in a numeric column (a `type: 'numeric'`
  of the column or of the settings above it, or the numeric renderer). A text column, a column with no type, and a type
  the file does not show get a report instead, because `numericFormat` is ignored there and `locale` is not.
- `themeToken` rules read the keys of the `tokens` object only. A key of `colors`, `icons`, `sizing`, or `density` that
  is spelled like a token is no token.
- `18.1.0/column-move-hooks` leaves no TODO in the code, and says that it matters only to code that detects a header
  click. `18.1.0/loading-markup` also reads the `title` and `description` of `show()` and `update()` on the loading
  plugin. `18.0.0/helper-sanitize` says that 19.0 removes the helper.
- A part of a settings object that goes to other code (`legacy(cfg.columns[0])`, a destructured member, an iteration
  callback parameter), and an object typed with a type of the project, hold the object like a use of the whole object:
  the options in it are reported and not rewritten. A grid cast or declared as a type of the project is not an instance.

### Fixed

- Every character of the Unicode categories Cc, Cf, Zl, and Zp is spelled as an escape in a file name, a path you typed,
  and a source line, in every output (the console, the report file, the diff, the error text, and every string of the
  `--json` document): `U+2028` and `U+2029` (`\u2028`), the zero width space, the direction marks, and the byte order mark
  stay out of the output, with the controls and the bidirectional overrides that were spelled before. One function does it.
- A path argument, an unknown option, a command, and a `--report` path that holds a line break or an escape is spelled
  `\x0a` and `\x1b` in the usage error text and in the `error` of the document.
- `18.0.0/wrapper-dom-selectors` also reports a template literal selector without an expression
  (``querySelector(`.ht-grid`)``), a bracket access (`['firstElementChild']`, `?.['children']`), an angle-bracket cast
  (`(<HTMLElement>document.querySelector('.ht-grid')).firstChild`), and `.childNodes`, `.lastElementChild`, and
  `.lastChild`, and reads `.ht-root-wrapper` like `.ht-grid`. A walk up (`.parentElement`) stays unreported.
- `19.0.0/height-auto` reads Vue `:height="'auto'"` and Angular `[height]="'auto'"` (a bound string literal), and the
  option in the object literal of a `:settings` or `[settings]` binding. `19.0.0/sizes-physical-index` reads an array
  literal or a function in `:col-widths`, `[colWidths]`, and the like, and in a script it follows a name to a `const`
  array or function (or a function declaration) of the same file. A name it cannot follow is reported with a message that
  says so. A bound name in a template is not followed.
- The line a message names (the `(line N)` of "This object is also passed to `computed()`", the spread, and "It is on line
  N" of a custom reader) is a line of the file, as the line of the entry is. In a Vue file it counted from the `<script>` tag.
- "Check what a query selects" is singular for one query, a list of more than 10 reads "a, b, and 5 more", and the
  `--report` error names the directory of a path outside the project as you typed it, not as `../../..`. "1 of 8 is
  marked in the code" has the right verb.
- The README says which entries have no marker (`18.1.0/license-key-missing`, `18.1.0/synthetic-header-mousedown`, and
  `18.1.0/column-move-hooks`, on purpose) and how to see it (`marker` in the JSON entry). It also says that a comment
  counts as a mark of Handsontable in a stylesheet, and that `--aggressive` reports an options object that a factory such
  as `computed()` also takes.

- `19.0.0/icon-pseudo-element-selectors` reads a stylesheet that names nothing else of Handsontable. A `::before` or
  `::after` rule on a common class name (`.changeType`, `.collapsibleIndicator`, `.columnSorting.sortAction`) was never
  looked at there. It is now a spot to review (the entry says to check that the selector targets the grid), and stays a
  manual step in a stylesheet that has another mark of Handsontable. A class that only the grid uses (`.ht_nestingButton`,
  `.beforeHiddenColumn`, and the other hidden row and column classes) now makes the stylesheet a Handsontable one on its
  own, so those rules are reported as manual steps wherever they stand. `ht_` and the four hidden indicators join the
  words that let a stylesheet through the first check.
- `19.0.0/sr-sp-language-code` reports an import of every published file of the `sr-SP` language: the paths with `.js`
  and `.mjs`, `handsontable/languages/sr-SP`, and `handsontable/dist/languages/sr-SP.js` and `.min.js`, as an `import`, a
  side-effect import, `require()`, and `import()`. Before, only `handsontable/i18n/languages/sr-SP` without an extension.

- A TODO on a statement that stands on one line and that no rule changed (`if (ready) call();`, a `for`, a `while`, a
  label, a declaration, an `export`) goes on the line above, and the statement keeps its line, byte for byte. Before, the
  printer put the body of a brace-less `if` or loop on a line of its own, and a label's statement lost its indent.
- A call that is removed as a whole statement is cut out of the text. The statements around it keep their lines, blank
  lines, and spaces, and its comments stay where they stood. Before, the printer reprinted the list: two statements that
  shared a line were fused (`a();b();`), a blank line after the last statement of a block was dropped, and a block
  that held only the call was printed as `{}`. A file mixing line endings is no longer refused when a statement is
  removed between two blank lines that end differently. An import that goes away because it was merged into another is
  still printed the old way.
- A directory inside a git repository, run with no `git` on `PATH`, is refused with exit code 2 when the run writes
  (`--allow-dirty` runs without the check, `--dry-run` previews), like a git that runs and fails. Before, the tool
  answered "not a repository" and skipped the clean-tree guard in silence. A `.git` directory or file at or above the
  directory counts. With none, nothing changes.
- A `this` member is a grid or a plugin only when every write of its name in the file qualifies, on any object:
  `wrapper.hot = mock`, `wrapper['hot'] = mock`, `Object.assign(wrapper, { hot: mock })`, an object literal key, a
  field, getter, or method of that name in any class, a subclass that sets it, and `Object.defineProperty`. Before,
  only writes inside the class counted, so `this.hot.undo()` was still rewritten on a mock.
- `.hotInstance` counts as the grid only when the file writes no value that is not a grid, `null`, or `undefined` to a
  member of that name, and declares no method or accessor of it. A declaration with no value or `null` (a Vue `data()`
  that returns `{ hotInstance: null }`) is neutral. Before, the name alone was enough.
- `getPlugin()` is checked for its receiver. A plugin counts when the receiver is an instance the file shows. A local
  object that stands in for the grid (`fake.getPlugin('manualColumnResize')`) is left alone and not reported, and any
  other unresolved receiver, a parameter named `hot` included, is reported. Before, any receiver counted, so a call on
  a mock was deleted and `columnHeaders` in its arguments was renamed.
- An object that a variable holds is edited only when every use of the variable is the grid's own. Another consumer
  (`legacyFormatter.configure(cfg)`), an alias, a return, or an export makes the rule report instead, naming the use.
  Before, the key was deleted or moved for the other consumer too. An object that a type names is not held by this check.
- An object that another object spreads is not changed by a move of a nested key, and not by a rename when the
  receiver sets the new name or the old one after the spread. Before, the receiver's own `locale` won after the spread.
- A read of the removed `hot.undoRedo` or an undo method in a test (`if (hot.undoRedo)`, `typeof hot.undo`,
  `'undo' in hot`, `hot.undoRedo?.clear()`), and the code that the same function guards with it, is reported and not
  moved: the member was `undefined` on 17.x, so the test answers differently now. So is a `hot.undoRedo` that is stored, passed, or compared, which was
  `undefined` there. The entry and the advice of `core-undo-methods` say that a plain call threw a `TypeError` on 17.x.
- `numericFormat.culture` moves to `locale` only on a column or a cell. At grid level it is reported, because a
  grid-level `locale` reaches every locale-driven column. A move that leaves a `numericFormat` with no `pattern` adds a
  note: 17.1 formatted a culture without a pattern with the Numbro pattern `'0'` (every decimal, no grouping), and 18.0
  sends the object to `Intl.NumberFormat` (grouping, three decimals). The note names the options that keep the 17.1
  output, `useGrouping: false` and `maximumFractionDigits: 20`.
- A `package.json` above the one being edited that starts with a byte order mark is read, as npm does. Before, it was
  dropped silently and `hyperformula` was added below a root that declared an older range. A file above that cannot be
  read as JSON is reported, and `hyperformula` is not added below it.
- A write is not a read of an option. `columns[2].correctFormat = true`, `delete x.datePickerConfig`, a destructuring or
  `for` head target, and a key in an object literal no longer make the custom reader check keep `correctFormat`,
  `datePickerConfig`, or `numericFormat.culture` elsewhere in the file (and no longer say "code that reads" it).
  `'correctFormat' in meta` now counts as a read, and `+=`, `||=`, and `++` still do.
- An object that the `updateSettings()` of a local object, an imported library, or a plugin takes is ignored by every
  rule, at any depth: no entry and no TODO from the `numericFormat.culture` move, the `numericFormat.pattern` and other
  detect rules, or the unrecognized-object reports. So are `setCellMeta()` and `setCellMetaObject()` calls on such a
  receiver. A receiver the file does not show is still reported.
- A manual step in a one-line block among statements (`{ let hot = ...; hot.undo(); }`) gets its marker, so the
  summary no longer says "7 of 9 are marked" for it.
- `--report /tmp/x.md` is no longer refused on macOS. A link on the part of the path outside the project directory is
  ignored. A link at or below the project, a report that is a link itself, and a path spelled outside the project that a
  link brings inside it are still refused, and the message names the link as typed.
- A start directory that cannot be read (`migrate locked`, or the project directory itself) is a usage error with exit
  code 2 and a sentence that names the path and the reason, not a stack trace. The note about a skipped unreadable
  directory no longer says to name it.
- `const { [Name]: x } = await import('module')` is no longer reported as a read of `Name`: a computed key is a name
  only when it is a string literal.
- A `detect` rule with an empty list in `import`, `call`, `hook`, `property`, `annotatedObject`, or `namespaceMember`
  fails when the manifests load, as an empty `whenAnyKey` already did, instead of matching nothing.
- `updateSettings()` is judged by its receiver. The object of `store.updateSettings({ ... })` on a local object, an
  imported library, a plugin from `getPlugin()`, or `this` is no longer taken for grid options, so `correctFormat` and the
  other keys in it are not rewritten or reported. A receiver the file does not show (a parameter, a global, the result
  of a call) gives medium confidence: reported, and rewritten only under `--aggressive`. A grid instance the file shows
  (`new Handsontable()`, `.hotInstance`, a typed instance) rewrites as before.
- An object that two passes reach keeps the higher confidence. An object that a mutable `cells` function returns and a
  `ColumnSettings` or `CellProperties` annotation also names is now rewritten, not only reported.
- `html-without-sanitizer` follows a local that holds markup and a spread the tool cannot read, one hop or more, and
  reports it like the same object written inline.
- A runtime `import()` of a module that still exists, read for a name that moved (`import('handsontable').Name`,
  `const { Name } = await import(...)`, a `.then()` callback), gets a `manual` entry like the type form always did.
- A string literal import name (`import { 'Name' as Local } from 'handsontable'`) moves with its module when the
  declaration has other specifiers. Before, the file ended as a `transform-error`.
- A directory that cannot be read (permission denied) outside git no longer stops the run. It is listed under "Skipped
  files" with the error code, and the other directories are migrated.
- A `detect` rule whose `whenAnyKey`, `withKey`, `receiver`, or matcher name has the wrong type, and a `dependency` `add`
  item with no `onlyIfDependsOn`, fail when the manifests load instead of during a run.
- A re-export (`export { Name } from`) of any name from a module that no longer exists gets a `manual` entry, not only
  the names the rule lists, as the documentation says.
- `moveNamedImport()` to the module the specifier already comes from moves nothing and deletes nothing (`same`). It
  used to delete the specifier, and the whole declaration when it was the only one.
- The lines of an inline Angular template written as a template literal with `${...}` stay the lines of the file when an
  expression spans lines. The expression is not read, and the part is still never printed.
- The candidate files of a long list are checked in batches of 256, as the git entries already were.
- The README says that a step in an HTML page (its `<style>` block included) or in a template has no marker.
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
- A changed file is written to a temporary file in its directory and renamed over the original, keeps its mode, and is
  checked against the text the tool read just before the rename: a file that an editor saved during the run keeps the
  editor's text and gets a `write-error`. The summary no longer counts the `changed` entries of a file that was not
  written (a failed write, a refused write, a file outside the project).
- A run that reads no file says "No files to migrate." with the reason (a path that holds nothing the tool reads, a
  directory that git ignores, a file of another type), on standard error and in the report, with exit code 0. Before,
  it ended with `Summary: 0 files changed` and no word. A project directory that an outer repository ignores is walked,
  with a note, instead of listing no file. A path argument is read in the letter case the file system stores.
- A submodule or an embedded repository is listed under "Skipped files". Outside git, the walk skips every directory
  that starts with a dot and the usual build output names (`out`, `storybook-static`, ...) and names each one that
  held files it reads, with the command that includes it.
- The clean-tree guard lists untracked files one by one (`--untracked-files=all`), so `status.showUntrackedFiles=no` in
  a user's configuration no longer turns off the check for them.
- `git` is started by the absolute path found in `PATH`, never from the project directory or a relative `PATH` entry.
  Before, on Windows, a `git.exe` in the project could run first.
- `--report` is refused when a directory on its path is a symbolic link, when it is another name for a migrated file
  (another letter case on a case-insensitive file system, a hard link), when it is an existing file of a type the tool
  migrates, and when an existing report is read-only (before any file changes, not after).
- `--from` detection takes the lowest bound of a range with `||` (`^18 || ^17` is 17) and asks for `--from` for a range
  with an open lower end (`<18.0.0`, `*`). It reads `node_modules/handsontable` only up to the project directory, and
  asks for `--from` when the installed version is outside the declared range.
- A syntax error in a Vue `<script>` or `<style>` block is reported on the line of the file, with the text of that line.
- A file with mixed line endings (CRLF, LF, a lone CR) keeps the ending of every line the tool did not change. When an
  edit sits next to a repeated line that ends in two ways, the file is left unchanged with a `transform-error`. A file
  that uses a lone CR everywhere keeps it. Before, the whole file came out in one ending.
- The Markdown report writes file names, quoted source lines, and the tags of the tool's own messages as code, escapes
  the rest, and every renderer and the CLI print a control character (an escape sequence) as `\x1b`.
- Many names in one CSS declaration value, and a stylesheet with tens of thousands of renamed declarations, take linear
  time. Before, 130 KB of `var(--ht-...)` references took 18 seconds and 1.5 MB of declarations took 6 seconds. A Vue
  script block with a run of 120,000 spaces took 9 seconds.
- A shebang line and a byte order mark survive a rule that prints the first statement again, and so do the comments and
  directives before it (a license header, `// @ts-check`, `'use client'`). Before, the shebang fused with the first
  statement (`#!/usr/bin/env nodeimport ...`), and a byte order mark was dropped. The printed file is compared with the
  source, and a lost comment or directive leaves the file unchanged with a `transform-error`.
- The comments of an import that a move removes (a line above it, a trailing note, a JSDoc block) move to the import
  that took its name. Before, they were deleted unless the import was the first statement.
- A `Handsontable.X` type is not replaced by a bare `X` when a type parameter, a block-scoped type, or a namespace member
  of that name is in scope at the reference. The reference is reported.
- A custom property is not renamed into a reference to itself (`--ht-border-radius: var(--ht-wrapper-border-radius)`),
  and a rule that already defines the new name keeps its uses of the old one. Both are reported. A name inside a string
  or `url()` of an at-rule (`@import url("...")`, `@warn "..."`) is left alone and reported, as in a declaration value.
- The three 19.0 rules `undo-false`, `col-widths-null`, and `editor-false` also read `:undo="false"` and its relatives on
  `<hot-table>` in Vue and Angular templates. A bare `v-bind="{ ... }"` on a wrapper tag is read for the option rules.
- An expression right after `export default` gets its line and its marker. A flagged child of a JSX element on a line of
  its own (`{cond && <HotTable />}`, `{items.map(...)}`) gets its own marker, and `marked` is true only for an entry
  that has one.
- A TODO goes above a directive for the next line (`// eslint-disable-next-line`, `// @ts-expect-error`,
  `// prettier-ignore`, `/* istanbul ignore next */`, `// stylelint-disable-next-line`) and not between the directive and
  its code, in code, in an array element, and in a stylesheet.
- `columnHeaders` in `{ ...opts, columnHeaders: false }` is not renamed: an explicit `colHeaders` wins over
  `columnHeaders` in the export options of 17.1 and later, so a `colHeaders` in the spread decided the header row, and the
  renamed key would win over it. A spread of an object literal that sets neither name still lets the rename through.
- `numericFormat.culture` with a value that can be `undefined` or `null` (`undefined`, `cond ? 'de-DE' : undefined`, `a &&
  b`) is reported and not moved: an own `locale` of `undefined` overrides the locale of the grid.
- A `cells` option or a meta hook (`afterGetCellMeta`, `beforeGetCellMeta`, `cell`) in the same settings that sets or may
  set an editor, a renderer, or a validator makes `correctFormat`, `datePickerConfig`, and
  `numericFormat.culture` stay and be reported.
- A re-export of every name of a module (`export * from`, `export * as ns from`) whose names a rule renames or removes
  gets an entry, once per rule. The JSDoc types of a file (`@param {Config}`) that still say the old name after an
  import rename are reported per line.
- The rules that repeat an earlier migration name it in `twins` (the two type aliases of 19.0, the Pikaday rule of 18.1),
  and a stylesheet marker of a twin is found, so following the guides one step at a time leaves one TODO, as a chained
  run does. `test/twin-rules.test.mjs` fails for a rule that repeats an earlier one without naming it.
- A password that holds an `@` (`git+https://user:p@ss@host/...`) is hidden up to the last `@` of the authority. The
  message about a `hyperformula` declaration above a package no longer prints the raw spec.
- A key of `overrides`, `resolutions`, or `pnpm.overrides` names a package by its last path segment: `some-lib/handsontable`
  is Handsontable, and `@acme/handsontable` is not.
- A test of a removed method that gives the same answer before and after (`hot.undo === null`, a comparison with a string)
  is no longer reported as a test, and the entry for one that does change says what the member was on 17.x (`undefined`)
  instead of claiming that the test never passed.
- A holder check reads `!x`, `x == null`, `x === undefined`, `'k' in x`, `x && x.y`, `while (x)`, and `Boolean(x)` as reads
  of the variable that holds an options object, so ordinary guards no longer make the rule report.
- `const HT = Handsontable; HT.helper.sanitize(x)` is found. A call on a plugin that a file keeps in a property of a local
  object, or in a `this` member set from a conditional, is reported as a call on an unconfirmed receiver.
- A git that runs and fails (`detected dubious ownership`, a corrupt repository) is no longer read as "not a repository".
  A run that writes stops with exit code 2 and git's message, and `--allow-dirty` or `--dry-run` reads the files without git
  and says so. git speaks English to the tool (`LC_ALL=C`).
- `migrate --list` works in a project whose `handsontable` range is a tag (`latest`). An empty `--from` or `--to` is a
  usage error.
- The CLI says to install the new ranges after it edited a `package.json`. A run on a folder names the `package.json`
  above it that still asks for an older version, and that it did not edit.
- A file that a failed write left unchanged is no longer listed under a note that says what a rewrite changed.
- A new import in a CommonJS file takes the quotes of its `require()` calls. A `.pika-single` or a theme class in a Vue
  `<style lang="less">` block is listed under "Skipped files", and a plain `<style>` block with only such a selector is
  read.
- The README says that `--report` is the one file the tool writes outside the project, if you point it there.

## [0.1.0] – not published

### Added

- The `handsontable-codemod migrate` command, with `--from`, `--to`, `--dry-run`, `--report`, `--only`, `--list`,
  `--aggressive`, `--no-todo`, `--include-draft`, `--allow-dirty`, `--allow-uncovered`, and `--max-file-size`.
- The 17.x to 18.0 migration and the 18.0 to 18.1 migration.
- Support for JavaScript, TypeScript, JSX, TSX, Vue single-file components, CSS, SCSS, HTML templates (report only),
  and `package.json`.

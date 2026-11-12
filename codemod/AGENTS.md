# AGENTS.md: migration codemod (`codemod/`)

`@handsontable/codemod` is a private CLI, `handsontable-codemod migrate`, that applies the mechanical part of a
Handsontable upgrade to a customer project and reports what it cannot do. Behavior comes from data: one
`versions/<semver>/manifest.json` per release, consumed by generic transforms. Usage and flags are in
[`README.md`](./README.md).

Plain `.mjs`, no build step, no `workspace:*`, no lifecycle scripts. The package is in `pnpm-workspace.yaml` only.
It is deliberately not in the root `package.json` `workspaces`, and not in the `all` list of
`scripts/translate-to-native-npm.mjs`, so version bumps and publish packing never touch it. Follow the
`node-scripts-dev` skill.

## Commands

- Lint: `npm run lint --prefix codemod` (also part of the root `npm run lint`).
- Test: `npm run test --prefix codemod`. CI runs it in the `Codemod tests` step of `lint.yml`, job `core`.
- The `test` script lists its files literally. `test/test-list.test.mjs` fails until the list and the `test/`
  directory name the same `*.test.mjs` files, so a new test file must be added to the script.
- Smoke test: `node codemod/bin/handsontable-codemod.mjs migrate --list --from 17 --to 18.1`. The last line counts the
  rules that rewrite and the rules that only report.
- `test/cli.e2e.test.mjs` spawns the real bin on a temp git project built by `test/helpers/sample-project.mjs`
  (`SAMPLE_FILES`, `createSampleProject()`). Add a file kind there when a transform starts to handle one.
- `test/readme.test.mjs` compares the rule counts in the README tables with `describeRules()`. A change to a rule's
  `safe`, or a new rule, changes a count, so update the two tables in `README.md`.
- `test/safety.test.mjs` pins the `safe` contract: the runner guard, the shipped data, one case per kind that flips
  its rules to `safe: false`, and a sweep that flips every rule of a manifest for every fixture input. Both expect
  reports and TODO comments only, and no `transform-error`.
- `test/idempotency.test.mjs` runs every fixture output a second and a third time, and runs one-line shapes of every
  TODO-emitting kind three times. A new kind that leaves a TODO adds a one-line case there.
- `test/manifest.test.mjs` checks every rule's `guide` anchor against the headings of the guide page with
  `anchorsOf()` in `test/helpers/guide-anchors.mjs`, the one slug function of the tests.

## Layout

| Path | Role |
|---|---|
| `bin/handsontable-codemod.mjs` | Entry. Sets `process.exitCode` from `main()`. |
| `src/cli.mjs` | Argument parsing, `--list`, rendering, exit codes. |
| `src/runner.mjs` | `run()` (disk), `transformFile()` (pure), `resolvePlan()`, `describeRules()`. |
| `src/versions.mjs` | Version parsing, range selection, `--from` auto-detect. |
| `src/manifest.mjs`, `src/manifest.schema.json` | Manifest loading and validation, `RULE_KINDS`. |
| `src/types.mjs` | JSDoc typedefs for the contracts below. No runtime code. |
| `src/transforms/index.mjs` | The registry: `KIND_ORDER`, `PHASE_TWO_KINDS`, the module list. |
| `src/adapters/*.mjs` | File type to parts and back. `template.mjs` gives an `.html` or `.htm` file one read-only `template` part. `vue.mjs` splits a `.vue` file (see Traps). |
| `src/transforms/detect.mjs` | The `detect` kind: report-only matchers (vocabulary in Traps). `validateDetectRule()` checks a rule. |
| `versions/18.1.0/custom/sanitizer-source.mjs` | Two `custom` rules for the `sanitizer` option, picked by the rule's `mode` (see Traps). |
| `src/transforms/css-variables.mjs`, `theme-tokens.mjs` | `cssVariable` (css, js strings, template report) and `themeToken` kinds. |
| `src/lib/string-literal.mjs` | `replaceStringLiteral()`: edit a string literal and keep its quote style. |
| `src/lib/todo.mjs` | The writer of TODO comments in the AST, and the only source of their text (`formatTodo()`; `carrier.mjs` places the same text after printing): `shortenAdvice()`, `formatTodo()`, `addJsTodo()` (a `//` comment, or a JSX comment for a `JSXElement` path), `addCssTodo()`, and `collectComments()` for the dedupe. |
| `src/lib/anchor.mjs` | Where a comment about a property can go: `enclosingAnchor()`, `hasOwnLines()`, `anchorForProperty()`. |
| `src/lib/option-sites.mjs` | `templateOptionSites()` (wrapper tag attributes in template text) and `dynamicOptionSites()` (assignments and `setCellMeta()`), shared by `options.mjs` and the `detect` `property` matcher. |
| `src/adapters/unsupported-style.mjs` | `.less`, `.styl`, `.stylus`, `.sass`: never parsed, only reported through `skipReason`. |
| `src/lib/safety.mjs` | The meaning of `safe`: `rewrites(rule)`, `modeOf(rule)`, `requiresSafe(kind)`, `reportInstead()`. |
| `src/lib/json-edit.mjs` | `JsonDocument`: edits a `package.json` by offset (`setString()`, `addMember()`), `scanJson()`, `memberPosition()`. Every edit is verified against the parsed model. |
| `src/lib/css-edit.mjs` | `CssDocument`: edits a stylesheet by offset (`replaceInDeclaration()`, `replaceInAtRule()`, `insertCommentBefore()`) and prints the original text with the edits spliced in. `print()` parses the result again and compares it with the postcss model. |
| `src/lib/validate.mjs` | `problemsOf()` and `assertRenameOrRemoval()`, the helpers behind the `validate(rule)` hook of a transform. |
| `src/lib/rename-key.mjs` | `renameKey()` and `removalAdvice()`, shared by the option, theme token, and CSS transforms. |
| `src/lib/hot-bindings.mjs` | What a file binds to Handsontable: `collectHotBindings()` (`isInstance()`, `isPluginReceiver()`, ...) and `isUnresolvedReceiver()`. |
| `src/lib/facts.mjs` | `addFact(ctx, name, line)`, `hasFactFor(ctx, name)`, and `factSite(ctx, name)`: facts keyed by name and directory, with the file and line of the first sighting (see Traps). |
| `src/lib/marker.mjs` | Where a generic TODO marker goes: `createMarkerIndex()` (a report line to its anchor), `markerTargets()` (the climb from a node to a property, array element, statement, or JSX element), and `cssTargetAt()`. |
| `src/lib/carrier.mjs` | `MarkerCarriers` and `spliceCarriers()`: a generic marker on an untouched one-line array element is added as text after printing, so recast does not reprint the element (see "TODO comments"). |
| `src/lib/dependency-range.mjs` | `planRange(spec, target)`: rewrite, keep, skip, or report a `package.json` range. |
| `src/transforms/import-source.mjs`, `export-rename.mjs`, `namespace-type.mjs`, `export-removed.mjs` | `importSource`, `exportRename`, `namespaceType`, and `exportRemoved` (rule shapes in Traps). |
| `src/lib/type-rules.mjs` | Shared by those four: `*` module and path patterns, option keys and advice placeholders, `chooseSource()` (which candidate module a name is imported from), `reportOpaqueReferences()`. |
| `src/transforms/methods.mjs`, `call-unwrap.mjs` | `methodRemove` and `methodMove` (receiver rule, see Traps), and `callUnwrap`. |
| `src/transforms/options.mjs` | `optionRename`, `optionMove`, `optionRemove` on option objects, wrapper attributes, and `context.callArg` arguments (see Traps). |
| `src/transforms/dependencies.mjs` | The `dependency` kind: range bumps, `add`, `reportMissing`, `reportPresent`, `replaced`, and `facts` (item fields in "Rule fields by kind"). `matchesWhen(j, root, when)` is the fact matcher. |
| `src/report.mjs` | `Report` (dedupe, `scope: 'run'` entries kept once with their `files`, ordering by version then rule id, `notes` for the top of the report), `renderConsole()`, `renderMarkdown()` (title with the versions and the date), `summaryLine()` (both renderers print it), `clusterByMessage()` (a message that several locations share is printed once, then the locations), `SKIPPED_RULE_ID`, `BELOW_FROM_RULE_ID`, and `counts().marked`. |
| `src/discover.mjs`, `git.mjs`, `diff.mjs` | Support modules. |
| `versions/<semver>/` | `manifest.json`, optional `custom/*.mjs`, optional extra rule files, `__fixtures__/`. |
| `test/*.test.mjs`, `test/helpers/` | Tests (`node:test`). Helpers are not listed in the test script. |

## Run model

1. `resolvePlan()` loads every manifest, resolves `--from` and `--to`, and selects manifests with
   `from < version <= to`. A partial `--from` stands for the end of its line (`17` means "any 17.x"), a partial
   `--to` for the highest known manifest of that line (`18` means the latest 18.x). `--from` falls back to
   `node_modules/handsontable/package.json`, then the `package.json` range minimum. `--to` defaults to the latest
   `released` manifest. `draft` manifests need `--include-draft`.
   `--only` takes a full rule id or a prefix that ends in `*`. A pattern that selects no rule in range is a usage error.
   A range with no manifest (`--from` not below `--to`) is a usage error that lists the known migrations. The
   auto-detect (`detectProjectVersion()`) runs once per path argument, from the path up to `cwd`, and paths that
   resolve to different versions are a usage error that asks for `--from`.
   The `from` of every manifest says which line it migrates from, and the lowest one is the oldest covered version
   (`oldestCovered()`). A `--from` below it is a usage error that names the earlier guides from `EARLIER_GUIDES` in
   `versions.mjs` (`uncoveredSteps()`), unless `--allow-uncovered` turns the same text into a note at the top of the
   report. A `--to` on a later minor line than the newest migration in range (`isNewerLine()`) runs up to that
   migration and says so, in the notes and at the top of the report. An empty range explains itself through
   `nothingToMigrate()`: a version that came from `package.json` or `node_modules` gets "already names", and a
   partial `--from` gets the `--from <minor>` hint taken from the `from` of a manifest. A `handsontable` range that
   names no version (`latest`) is a usage error that asks for `--from`. With no `--from` and no range at the path or above
   it (a monorepo root), `scanPackageVersions()` reads the `package.json` files below the path arguments: different
   versions are a usage error that lists the packages, equal ones become the `--from` and the note names the files.
   `plan.fromText` carries the resolved `--from` to the transforms as `ctx.fromText`.
   A `dependency` range below `--from` (`lineBelowFrom()`: an earlier line that does not admit the `--from` version)
   is never bumped. `dependencies.mjs` reports one `below-from` warning per `package.json` (`reportBelowFrom()`), the CLI
   repeats it on stderr after the report, and the exit code stays 0. A CDN URL below `--from` gets a sentence in its own
   entry. A raised `peerDependencies` range also gets a `manual` entry (`reportPeerRaised()`).
2. The git guard refuses a dirty tree (exit 2) unless `--allow-dirty`. It does not apply to `--dry-run`,
   `--list`, `write: false`, or a directory outside a git repository, where `onWarning` gets a one-line notice before
   the first write. An untracked file at the `--report` path (`reportPath`) is not a change.
3. `discover()` lists files (`git ls-files -z --cached --others --exclude-standard`, or an fs walk), drops
   `node_modules`, `dist`, `build`, `coverage`, `.git`, `*.min.*`, `*.d.ts`, files deleted on disk, and any
   extension no adapter handles. JSON is limited to `package.json`. A file named on the command line bypasses the
   generated-output filter. It never follows a symbolic link: a link to a file or a directory, a path argument that
   is one or sits below one, goes to its `skipped` list and the report shows it under "Skipped files". Git lists a
   link to a directory as one entry without a handled extension, so `directoryLinks()` checks the entries of the git
   list that no adapter handles with `lstat`, and the fs walk checks every entry. A path
   check uses `leavesDirectory()`, so a directory named `..odd` is inside the project. Before a write, `run()` asks
   `resolvesInside()`: the real path of the file must be inside the real project directory. `--report` is refused
   (exit 2) when its target is a symbolic link, a file git tracks, or a file the run migrates
   (`assertReportTarget()`). The skipped entry of a link says where it points when the target is inside the project
   (`linkMessage()`), and whether the run migrates it.
4. Phase 1 visits every file through `transformFile()`: adapter by extension, skip when no selected rule has a
   registered transform for the adapter's kinds, skip when the adapter's cheap `precheck` regex does not match,
   parse once, run versions ascending and kinds in `KIND_ORDER`, print only parts that called `markChanged()`.
   Parse and transform failures become `parse-error` and `transform-error` warning entries, the file is left
   byte for byte alone, and the run ends with exit code 1. A file above `MAX_FILE_BYTES` (1 MB, `--max-file-size`) is
   not read and becomes a `skipped-file` warning. `transformFile()` also turns what an adapter cannot read into
   `skipped-file` warnings: `skipReason` (whole file), `handle.skippedBlocks` entries with `relevant: true` (Vue), and
   `skipNotes(source)` (inline scripts of an HTML page). The report lists them under "Skipped files".
5. Phase 2 visits only `package.json` files and runs the kinds in `PHASE_TWO_KINDS` (`dependency`) after phase 1
   has filled `ctx.facts`. Before phase 1 the runner records the directory of every discovered `package.json`
   (`registerPackageDir`), so a fact is credited to the nearest `package.json` above the file it came from.
   A phase 2 module that needs facts declares `scan: { fileKinds, precheck? }` on the transform: phase 1 then also
   calls its `apply`, with its rules, on parts of those kinds, using `scan.precheck` instead of the adapter's.
   That call collects facts and never edits. The `dependency` module is the only user.

`transformFile({ filePath, source, plan, options, facts, registry, phase })` reads and writes nothing. The run
loop and the fixture tests both call it, so a fixture needs no temp directory, no git, and no discovery.

## The transform contract

Every file in `src/transforms/` default-exports a `Transform` (typedefs in `src/types.mjs`):

```js
export default {
  kinds: ['cssVariable'],     // rule kinds the module handles
  fileKinds: ['css'],         // part kinds it may edit: js, css, vue, json, template
  apply(ctx, rules) {},       // sync or async
};
```

`apply` runs once per part whose kind is in `fileKinds`, once per selected version, with that version's rules of
the module's own `kinds` in manifest order. A module serving several kinds runs once per version, at the position
of its earliest kind in `KIND_ORDER`.

`ctx`:

| Field | Meaning |
|---|---|
| `filePath` | Project-relative path, forward slashes. For extension checks and messages only. |
| `fileKind` | `js`, `css`, `vue`, `json`, or `template`. Always one of the module's `fileKinds`. |
| `source` | Original text of this part. |
| `j` | jscodeshift API bound to the right parser. `null` unless `fileKind` is `js`. |
| `root` | Parsed form, edited in place. `js`: a jscodeshift Collection. `css`: a postcss Root. `json`: the parsed value. |
| `report(entry)` | Add `{ ruleId, severity: 'changed' or 'manual' or 'warning', line?, message, lines?, scope?, mergeKey? }`. The runner fills `file`, `guideUrl`, and adds the part's `lineOffset` to `line` and `lines`. Identical entries collapse. `lines` lists every match of a collapsed group, and the renderers print them. `scope: 'run'` marks a note that is the same in every file (a rule's `note`): the `Report` keeps it once with the list of files, under "Read once". A later entry with the same `mergeKey` in the same part replaces the earlier one, so two migration steps that touch one spot report the net result once. `merge: 'earliest'` keeps the first entry instead: two merge policies exist. `latest` (the default, used by `dependency` bumps) reports the net change with the latest target. `earliest` (used by `detect` rules that share a `mergeKey`) lets the rule of the earliest migration own the id, the message, and the guide link. `todo: false` keeps one `manual` entry out of the code. |
| `todo(target, ruleId, text, comment?)` | Leave `TODO(handsontable-codemod <ruleId>): <first sentence of text> See <guide link>` before a js node or path or a postcss node, once, and add a `manual` entry with the whole `text`. `comment` replaces `text` as the source of the comment when the caller has a better short form. The link is added only for a rule with a `guide` anchor. Returns whether a comment was inserted. It calls `markChanged()` itself. `json` gets the entry only. A NodePath of a `JSXElement` or `JSXOpeningElement` gets a JSX comment `{/* ... */}` before the element (or before the expression that holds it) when the element is a child of another element, else a `//` comment on the enclosing statement when it starts at most 3 lines above, else on the element's first attribute. |
| `comment(target, ruleId, text)` | The comment half of `todo()`: the same TODO comment, no report entry. A removal uses it, so its one `changed` entry carries the advice. |
| `json` | For a `json` part, the `JsonDocument` that edits the text by offset: `setString(section, name, value)` and `addMember(section, name, value)` return `false` and change nothing when the scan of the text and the parsed file disagree, and the transform then reports `manual`. `null` for every other kind. A transform never prints a `package.json` with `JSON.stringify`. |
| `css` | For a `css` part (a stylesheet or a Vue `<style>` block), the `CssDocument` that edits the text by offset and keeps `root` in step. A transform reads the postcss `root` and edits only through `replaceInDeclaration(declaration, pattern, replacement)`, `replaceInAtRule()`, and `todo()`/`comment()`. Each replace returns `null` (no match), `true`, or `false` (the text at the node's offsets is not what the model says, or the value holds a comment): on `false` the transform reports `manual` and edits nothing. A transform never assigns `decl.prop`, `decl.value`, or `params` itself and never stringifies `root`. `null` for every other kind. |
| `cssScope`, `lineOffset`, `fromText` | `'scoped'`, `'module'`, or `null` for the Vue `<style>` block of a `css` part; the part's zero-based line offset (add it by hand when a line is stored outside `report()`); the run's `--from` as text. |
| `facts` | A `Set` shared across the run. Add `uses-formulas` style keys in phase 1, read them in phase 2. |
| `options` | `{ aggressive, dryRun, todo }`. `todo: false` (`--no-todo`) makes `todo()` and `comment()` write nothing and switches the generic markers off. `markers: false` (tests use it) switches off only the generic markers. Never write to disk from a transform. |
| `markChanged()` | Call after every edit of `root`. An untouched part is never printed, so the file keeps its exact bytes. |

Report line numbers are one-based and relative to the part's own source. The `todo` entry is reported on every
run, while the comment is inserted only once: idempotency means zero changed files, not zero entries.

Rules for transforms:

- Rewrite only what is certain. When there is no type information, report instead of guessing.
- Never insert a sanitizer, and never insert or invent a license key.
- Do not mention tickets, tasks, or reviews in comments. Cite code by a greppable symbol, not by a line number.
- Edit `root` in place, report every edit as `changed`, and leave every other byte alone. In a `css` part edit through
  `ctx.css`, which splices the original text (see the `css` row above).

## Rule kinds and manifest fields

`RULE_KINDS` in `src/manifest.mjs` is the validator's table: required and optional fields per kind, on top of
the common fields (`id`, `kind`, optional `guide`, `safe`, `minConfidence`, `message`, `advice`). `safe` is
required for every kind except `detect` and `exportRemoved` (see "The `safe` contract"). The field sets
are provisional. The author of a kind's transform owns its row: add the fields the transform reads and mirror the
change in `src/manifest.schema.json`. Extra properties on a rule are allowed. `test/manifest.test.mjs` pins the
kind list and each required list against the schema, and `KIND_ORDER` against both.

`include` files (`{ "rules": [...] }`, relative to the version directory) are appended after the inline rules.
`custom` rules name a module, relative to the version directory, that default-exports
`{ fileKinds, apply(ctx, rule) }`; `src/transforms/custom.mjs` runs it with the same `ctx`.

A transform may export `validate(rule)`: it returns the problems of one rule that the table cannot express (a
`cssVariable` with neither `to` nor `removed`, a `methodMove` with a bad `via`, a `detect` without `message`). The
registry exposes it as `registry.validate(rule)` and `loadManifest()` calls it for every rule that passed the shape
check, so a malformed rule fails `--list` and `manifest.test.mjs` with the rule id and the field, and never shows up
as a per-file `transform-error`. Write the check as a function that throws, use it in `apply`, and wrap it with
`problemsOf()`.

### Rule fields by kind

Fields differ between kinds on purpose (`from` is an option name, a module, or a CSS variable): do not rename a field
across kinds. Every kind also takes the common fields, and `safe` is required except for `detect` and
`exportRemoved`. `*` marks a required field.

| Kind | Fields |
|---|---|
| `importSource` | `from*` module, `exports*` (name to `{ to, note }` or `{ removed, advice }`), `fallback`, `moduleRemoved`, `todo` |
| `exportRename` | `source*` (module or list), `from*`, `to*`, `toSource`, `note`, `todo` |
| `namespaceType` | `from*` (path or list), `to: { name?, source }` or `removed` + `advice`, `positions`, `optionKeys`, `noKeyAdvice`, `note`, `todo` |
| `exportRemoved` | `source*` (module, list, or `handsontable/plugins/*`), `name*`, `advice*`, `except`, `optionKeys`, `noKeyAdvice`, `message` (replaces the lead sentence "is no longer exported from"; same placeholders as `advice`) |
| `optionRename` | `from*`, `to*`, `context: { callArg: [methods], receiver?: { plugin } }` |
| `optionMove` | `from*` (`<option>.<key>`), `to*` (a sibling), `report` |
| `optionRemove` | `name*`, `todo`, `advice` |
| `methodRemove` | `methods*`, `receiver*` (`"any"`, `"instance"`, or `{ plugin: key or keys }`), `advice` |
| `methodMove` | `methods*` (old to new name), `via*` (`{ method, args }`), `receiver*` (`"instance"` or `{ plugin }`), `properties` |
| `callUnwrap` | `callee*` (dotted path), `arg` |
| `cssVariable`, `themeToken` | `from*`, then `to` or `removed` + `advice`; `themeToken` also `callees` |
| `dependency` | `bump`, `replaced`, `add`, `reportMissing`, `reportPresent`, `facts` (item fields below) |
| `detect` | `match*`, `files`, `message`, `severity`, `requires`, `emitsFact`, `unlessFileMatches` (regex on the part text: the rule skips a part that matches), `mergeKey` (rules of other versions with the same key report a spot once, the earliest one wins), `todo` (`false` leaves no marker for the rule) |
| `custom` | `module*`, plus whatever the module reads (`mode`) |

`dependency` item fields: `bump` maps a package name to a target version. `replaced` maps a package name to the
manual text that names its replacement. `add` items take `name*`, `range*`, `whenFact`, `onlyIfDependsOn` (a package
name or a list; the item applies when the `package.json` declares one of them). `reportMissing` items (the package
is not declared) take `name*`, `whenFact`, `onlyIfDependsOn`, `message`. `reportPresent` items (the package is
declared) take `name*`, `message*`, `whenFact`, `onlyIfDependsOn`. `whenFact` names a fact that phase 1 found for the
project (`imports-numbro`). `facts` items are `{ name, when }` where `when` is `{ import: "<module>" }` or
`{ property: "<key>", withKey?: "<key>" }`, and phase 1 adds the fact when a js part matches.

## How to add a version

1. Create `versions/<major.minor.patch>/manifest.json` with `version` (equal to the directory name), `from` (the
   version line it migrates from: `"17"` for 18.0.0, `"18.0"` for 18.1.0; it must be below `version`), `status`
   (`released` or `draft`), `guide: { url, source }`, and `rules`. `guide.source` is the repository path of the
   migration guide page. `guide.url` is `https://handsontable.com/docs/javascript-data-grid/<permalink>`
   without a trailing slash, with the permalink read from the guide's frontmatter. Put the rules in
   `rules/*.json` files and list them in `include`.
2. Generate the exports diff when the release changed the typings: run `tools/derive-type-map.mjs` on the two
   packed releases and save the result as `versions/<version>/exports-diff.generated.json`.
   `test/type-rules.test.mjs` loops over every diff file and fails until every removed export and every removed
   `Handsontable` namespace member has a rule. A version without a diff file is skipped.
3. Give each rule an id `<version>/<slug>`, a `guide` anchor that exists on the page (leave it out when the page
   has no section for the rule), and `safe` (a boolean, except on `detect` and `exportRemoved` rules). Pick the kind
   and its fields from "Rule fields by kind". A malformed rule fails when the manifests load.
4. Add fixtures (below), one per rule at least, with a negative case next to each positive one.
5. Add a row to the "Supported migrations" table of `README.md` and update the kind table. The first column is
   `<from line> to <major.minor>`, for example `18.0 to 18.1`. `test/readme.test.mjs` requires one row per released
   manifest and compares the counts with `--list`.
6. Decide `status`. A `draft` manifest runs only with `--include-draft`, and `--to` defaults to the latest
   `released` one, so a migration under work stays `draft` until its guide is final.
7. Run the package tests, the lint, and the smoke test. `manifest.test.mjs` checks that every manifest loads, ids
   are unique and prefixed, `from` is valid, and the guide source file and anchors exist.

### Planned for 19.0

A first read of the 19.0 migration guide sorted its sections into four buckets: 18 can be written with the existing
kinds, 11 need a small extension of a kind, 4 need a custom module, and 26 cannot be automated. Draft the manifest
in that order and start with the first bucket.

## How to add a rule

Add an object to `rules`, pick an existing `kind`, fill its required fields, and add a fixture. A rule of a kind
with no registered transform is listed as "not implemented" by `--list` and skipped silently by a normal run.

## How to add a rule kind or a transform

1. Add the kind to `RULE_KINDS` and `src/manifest.schema.json` (the `enum` and an `allOf` branch), and, if it is
   new, to `KIND_ORDER`. Decide its phase (`PHASE_TWO_KINDS`).
2. Write `src/transforms/<name>.mjs` against the contract above and list it in `TRANSFORMS` in
   `src/transforms/index.mjs`. Two modules cannot claim one kind.
3. If the transform needs a new file type, add an adapter that follows the `Adapter` typedef and register it in
   `src/adapters/index.mjs`. An adapter with `implemented: false` is skipped by the runner.
4. Set the adapter's `precheck` so the file is parsed only when it can matter. The CSS precheck does not require
   the word "handsontable".

## Fixtures

`versions/<version>/__fixtures__/<case>/` holds `input.<ext>`, `output.<ext>`, and optionally `report.json` and
`options.json`. `test/fixtures.test.mjs` finds every fixture by itself and, per fixture:

- transforms the input with only that version's manifest and asserts the output equals `output.<ext>`;
- asserts that no entry is a `parse-error` or a `transform-error`;
- compares `report.json`, an array of `{ ruleId, severity, line? }`: every expected entry must match a distinct
  actual entry on the fields it names, and extra actual entries are allowed. `report.json` may also be
  `{ "exact": true, "entries": [...] }`: the actual report must then have exactly that many entries, each matched on
  the fields it names. Every `detect-*` fixture and every negative fixture uses exact mode (an empty list for a
  negative fixture that reports nothing), and a fixture whose run reports anything has a `report.json`;
- transforms the output again and asserts zero changes (idempotency);
- treats a fixture whose output equals its input as a negative fixture that must stay byte-identical.

`options.json` may set `aggressive` (boolean), `only` (array of rule ids), `phase` (`2` for a `package.json`
fixture), and `facts` (keys present before the run, such as `["uses-formulas@."]`). Put the non-match in the fixture of
the rule, for example a longer name that shares a prefix. Fixture directories are excluded from lint by
`.eslintignore`.

## The `safe` contract

`src/lib/safety.mjs` is the one definition. Every rewriting transform asks `rewrites(rule)`.

- `safe: true`: the tool applies the rewrite by default.
- `safe: false`: the tool never edits code for the rule. It reports `manual` entries. It may leave a
  `TODO(handsontable-codemod ...)` comment, which is not a code change, when the rule says `todo: true` or the rule
  only says that something was removed (`removed: true`, `exportRemoved`, an `optionRemove` that is not safe).
- `detect` and `exportRemoved` rules only report. The manifest loader gives them `safe: false`, and a `safe: true`
  on them is a validation error. Every other kind must state `safe`: an omitted value is a validation error, so
  nothing defaults.
- `createContext` in `runner.mjs` enforces it: a `changed` entry from a rule that does not rewrite throws, and the
  file ends as a `transform-error`. `ctx.todo()` and `manual` entries stay legal.
- A rule that is not safe still tells the user what to do: `reportInstead()` writes the `manual` entry (the rule's
  `note` or `message` follows the instruction) and, for `todo: true`, the TODO comment. A removal advisory
  (`removed: true` on `cssVariable`, `themeToken`, `namespaceType`) never deletes, so its `safe` is `false`.
- Use `safe: false` for a change that is not behavior-preserving. `18.0.0/helper-sanitize` ran DOMPurify in 17.1 and
  is a pass-through in 18.0, so unwrapping it would drop sanitization the project relies on. A rename to the
  documented successor type is not that case, even when the successor is looser: `type-multicolumnsorting-config`,
  `type-columnsummary-endpoint`, `type-columnsummary-detailedsettings`, `type-undoredo-action`,
  `type-customborders-borderoptions`, and `ns-customborders-borderoptions` are `safe: true`, and a one-sentence `note`
  says what changed in the shape. The note is a `manual` entry with `scope: 'run'`, so it shows once per run under
  "Read once". Keep a type rename report-only (`safe: false`, `todo: true`) only when the successor is not the same
  concept.
- `optionRemove` is `safe: true` only when the removed option is ignored at runtime in the target version.
  `correctFormat` (no code reads it in 18.0.0, 18.1 warns) and `datePickerConfig` (`DateEditor#prepare` warns and
  ignores it) qualify. Its comment says `Deleted <name> here.` only on a deletion.

## TODO comments

Two writers leave a marker. A transform that knows the exact node calls `ctx.todo()` or `ctx.comment()`. Every other
`manual` entry of a js or css part gets a generic marker at its `line` (and at each of `lines` for a collapsed
entry): `createContext()` collects them and `applyMarkers()` places them after all transforms ran, so a line still
names the node it was taken from. The anchor is the outermost node that starts on the line (a function body on the line
of its signature never takes it), then `markerTargets()` climbs to a property, array element, or statement on lines of
its own, a JSX element, or a declaration; a `BlockStatement` is never an anchor. A run is idempotent because
`hasJsTodo()` looks for the same comment on every place of that chain (an earlier run, or a rewrite of the element,
can have spread a one-line object over lines, which turns a property into one with its own line), and `addCssTodo()`
looks through the run of comments before the node. The default is on for a `manual` entry in a js or css part. It is
off for a `scope: 'run'` note, an entry with `todo: false`, a rule with `todo: false` (`18.1.0/license-key-missing`, whose advice holds for every environment, and
`18.1.0/synthetic-header-mousedown`, which flags test code), and any part that cannot hold comments (templates, HTML,
`package.json`). `stored.marked` says a marker is in the code, `counts().marked` totals them, and the CLI prints
"N of M are marked in the code" from it. The first sentence of every advice or message starts with an action verb:
`test/advice.test.mjs` checks the rule files, and the TODO text of every fixture output.
A SCSS file that already has `//` comments gets a `//` marker on a line of its own (`CssDocument` `lineComments`).

A comment on a node makes recast print that node again, and recast prints an object it prints again over several
lines, so a marker on the `{ ... }` of a one-line array element would spread it although no key changed. A node of a
different type is patched on its own range, with no layout, so `applyMarkers()` hands such an element to
`MarkerCarriers` (`src/lib/carrier.mjs`) instead of `addJsTodo()`. After the last mark, `commit()` swaps the element
for an identifier named by a sentinel and the exact text of the element, and `printJsPart()` calls `spliceCarriers()`,
which turns each sentinel into the `//` lines, in the indentation and line terminator of the line it stands on. Only
the text of the part is touched after printing, so tabs and CRLF stay as they were. The swap is checked, and fails
closed: an element is carried only when it is an expression on lines of its own, a single line, not in parentheses,
has the comments the parser found, and prints (`printWithoutComments()`, recast's own printer on a copy without
comments) as its original text, so a carrier can never undo a rewrite. Any other element goes through the AST as
before and is reprinted. A sentinel that is missing or stands twice throws, and `transformFile()` turns that into a
`transform-error` that leaves the file alone. Only an array element takes this path: a property or statement keeps its
children's text when it is printed again, so its comment never moves anything. The comment text always comes from
`formatTodo()`, and `hasJsTodo()` and `MarkerCarriers.has()` are the two dedupes of one run.

A TODO comment is `TODO(handsontable-codemod <ruleId>): <first sentence of the advice> See <guide link>`. The advice
is cut to about 100 characters by `shortenAdvice()`: the first sentence, plus the next one while the first is under
40 characters. The full advice stays in the report entry. Write the advice of a rule so that its first sentence says
what to do. A caller with a better short form passes it as the fourth argument of `ctx.todo()`. Dedupe compares the
whole comment, and the text is a pure function of the rule, so a second run adds nothing. The parser attaches a
comment on a one-line object to the property before it or after it, so `addJsTodo()` does not trust the attachment:
it takes the comment list of the whole part (`collectComments()`) and counts a comment with the same text that has
nothing but white space, commas, and `}` between it and the target (`sitsBefore()`). A node the run built has no
offsets, so only its own comments count. recast prints a trailing line comment before its node, never after it, so
a comment cannot trail the last property of an object. A TODO about a property that stays goes on the property
when it has lines of its own, else on the enclosing statement (`anchorForProperty()`).

## Traps

- ESLint runs with the root config through `.eslintrc.cjs` and needs `--ext .mjs,.cjs`. `space-before-function-paren`
  is `never`, so write `async() =>`, and `arrow-parens` wants parentheses around a parameter of a block-bodied
  arrow. `npx eslint --fix` fixes both.
- The tests build temp projects under `os.tmpdir()` and run `git` with an explicit identity. Never create a test
  project inside the monorepo, or git sees the monorepo.
- `jscodeshift` parsers: `ts` for `.ts`, `.mts`, `.cts`; `tsx` for `.tsx`; `babylon` for everything else, because it
  parses JSX, Flow-style annotations, and top-level await in a `.js` file.
- A recast reprint changes only the nodes a transform touched. The tool writes only changed files and tells users to
  run their formatter.
- recast prints a `StringLiteral` with the file-wide quote style and ignores its raw text, so editing `value` flips
  the quotes of that one string. Use `replaceStringLiteral()` from `src/lib/string-literal.mjs`: it swaps the node
  for a `Literal` that carries the raw text, which recast prints as is.
- The `vue` adapter returns parts in source order: a `js` part per `<script>` and `<script setup>` (parser by
  `lang`), a `css` part per `<style>` (`css`, `postcss`, `scss`) that carries `scoped` and `module` (read as `ctx.cssScope`), and a `template` part with `root = { content }`.
  `lineOffset` is the zero-based line of the block content start, which is the tag's line, so part line 1 is the tag
  line. Parts carry `start` and `end`, and `print` splices changed parts back last to first. A script or style block
  without a match for the `js` or `css` precheck gets no part, and `less`, `stylus`, `sass`, and `src=` blocks are
  listed in `handle.skippedBlocks`. A transform edits a template by assigning `root.content` and calling
  `markChanged()`. The adapter's `precheck` lets a file through when it names `handsontable` or a `--ht-` variable,
  or opens a `<hot-table>`, `<hot-column>`, `<HotTable>`, or `<HotColumn>` tag, so a template-only component with a
  globally registered wrapper still gets its template reports. The `.html` adapter's `TEMPLATE_PRECHECK` has matched
  those tags from the start.
- `cssVariable` and `themeToken` rules are a rename (`from`, `to`) or a removal (`from`, `removed: true`, `advice`).
  `RULE_KINDS` cannot express "`to` or `removed`", so the transforms throw on a rule with neither and
  `validate(rule)` of both kinds checks it at load. `themeToken` rewrites keys only inside the arguments of
  `registerTheme`, `reinitTheme`, and `.params()` (a rule can set `callees`); `createTheme` is not public API. A
  `.params()` call needs a theme receiver (`isThemeReceiver()`): a call chain rooted at a binding of
  `handsontable/themes` (import, namespace import, or `require`), or a variable that holds one (`addThemeVariables()`,
  one hop). `axios.get(url).params({ ... })` stays untouched. The search for keys stops at a function nested in the
  argument (`insideNestedFunction()`), because code that runs later is not the theme configuration.
- A `cssVariable` rule edits a `--ht-` string in a js part without the `isHotFile` guard on purpose: `--ht-` is
  Handsontable's own namespace, so a file that names such a variable uses Handsontable styling, like a `.css` file with
  no imports. That is the only exception. Every other rule kind needs a Handsontable import or global, and
  `test/styles.test.mjs` pins both halves on a file with no imports (the `--ht-` string is renamed, `culture`,
  `correctFormat`, and `.saveManualColumnWidths()` stay untouched and unreported). Do not add a guard to `css-variables.mjs`.
- A guide anchor on the docs site drops the list number: `## 6. Update theme wrapper border variables` is
  `#update-theme-wrapper-border-variables`, not the old `#_6-...` form.
- Option rules (`options.mjs`): a rule rewrites an object when its confidence from `findOptionObjects` reaches the
  rule's `minConfidence` (default `high`, `--aggressive` lowers every rule to `medium`); below the bar the key is
  only reported. No shipped rule sets `minConfidence`, so a heuristic object is reported until `--aggressive`.
  `optionRemove` keeps every comment of the removed property (`carryComments()` moves them in front of the next
  property, else the previous one, else the enclosing anchor). It deletes the property only when its value is
  inert (`isInertValue()`: a literal, an identifier, a member read, a function expression, or an operator, object,
  array, or template over those). A value with a call, `new`, or `await` keeps the property, leaves a TODO, and
  reports `manual`. A deletion makes one `changed` entry that carries the advice, and the comment comes from
  `ctx.comment()`. `optionMove` moves nothing into an object that has a spread (or a JSX element with a spread
  attribute), because the spread may already set the destination. `optionRename` with `context.callArg` and
  `context.receiver: { plugin }` rewrites only calls on `x.getPlugin('<key>')` or a variable the file sets from it, and
  reports a `manual` entry for a call on another unresolved receiver in a hot file that sets the key. `medium` objects exist only in a file that imports or uses Handsontable (`isHotFile`), so a file with
  none is never edited, even under `--aggressive`. A `heuristic` object also needs `corroborated()`: at least two known
  option names besides the key the rule acts on (`ownKey()`), one of them outside `GENERIC_OPTIONS`. So
  `{ locale, numericFormat: {...} }` and `{ correctFormat, datePickerConfig }` stay reports in a hot file. A
  template part and the assignment forms are only reported (`reportTemplateOptions()`, `reportDynamicOptions()`,
  both fed by `lib/option-sites.mjs`). The object argument of `setCellMetaObject(row, col, {...})` is the exception:
  on a receiver `isInstance()` confirms, `findOptionObjects` returns it as a high `cell` object (origin
  `setCellMetaObject`) and `reportDynamicOptions()` skips it, so the rules rewrite it like a `cells()` return. On any
  other receiver the object is `claimed`, so the key heuristic never reports it, and the dynamic site is the one entry
  (its message names the method that makes the call). The `columns`, `cell`, and `cells` JSX attributes of a wrapper
  component go through the same `expandOption()` as the keys of a settings object. A removed JSX attribute puts its TODO next to the element (see `todo()`). Rule shapes: `optionRename` `{ from, to, context?: { callArg: [method names] } }` (with `callArg` it
  acts on object-literal arguments of member calls, whatever the finder says); `optionMove` `{ from: "<option>.<key>",
  to, report? }` (`to` is a sibling of `<option>`, the key lands before `<option>`); `optionRemove` `{ name, todo?,
  advice }` (`todo` defaults to true). Edits that change the length of `properties` make recast reprint the whole
  object: expect a blank line before a commented or multi-line property, a dropped trailing comma, and an expanded
  one-line object. A same-length edit would patch only the replaced element, but no move can use that: the emptied
  `numericFormat: {}` must stay. The 18.x `intlFormatter()` in `renderers/numericRenderer/utils.ts` reads
  `numericFormat ?? DEFAULT_INTL_FORMAT`, so a nullish value gives no grouping and up to 20 fraction digits, while
  `{}` gives the `Intl.NumberFormat` defaults. Deleting the empty object would change what the grid shows, and
  `test/options.test.mjs` pins the assumption against that source. Replacing an object's text from its source (a
  parsed node that recast prints verbatim) was left out too: a later rule would hold stale paths, and a TODO an
  earlier rule attached to a child would be lost. Anchor a TODO only on a property,
  statement, declaration, or array element, never on an object after `return`, where `return // c` ends the
  statement. Removing the property that carries a TODO moves the TODO on, so rules sharing an object lose none.
  The `advice` never says the property was deleted, because the rule may not be safe. The comment of a deletion starts
  with `Deleted <name> here.`. A rule that is not safe leaves the property and puts the TODO before it (before the
  enclosing property, statement, or array element when the object is on one line).
- The `css` adapter never prints the postcss root. postcss 8's stringifier escapes `<style` and `</style` in comments
  and strings (`\3c style`), so printing the root changes bytes no transform touched. `printCssPart()` asks the part's
  `CssDocument` for the text: the original with each recorded edit spliced in by offset (a renamed property or value,
  renamed at-rule parameters, an inserted `/* TODO(...) */` that copies the node's indentation and the file's line
  ending, or sits inline in a one-line file). Offsets count from after a byte order mark, which postcss strips. A value
  or property that holds a comment is not edited (`replaceInDeclaration()` returns `false`). `print()` throws when the
  edited text does not parse to the model, and `transformFile()` turns that into a `transform-error` that leaves the
  file alone. `test/fixtures.test.mjs` holds every css, scss, and vue fixture to "a changed line is a line a report
  entry names, an added line is a TODO comment".
- The `json` adapter does not print the parsed value. A `package.json` is edited by offset through
  `JsonDocument` (`ctx.json`), so every byte outside the edited value stays: escapes (`é`, `\/`), number
  spelling (`1.0`, `1e3`), key order, tabs, CRLF, a minified file. An added dependency is one new line (or one new
  member in a minified file) that copies the indentation, separators, and key order of its neighbors. The edited text
  is parsed again and must equal the intended model, else nothing changes and the transform reports `manual`.
  A repeated key in a section also gives `manual`.
- Adding the package changed `pnpm-lock.yaml`, and it must change nothing else. The root `pnpm.overrides` pins
  `postcss` to `^8.5.23`, so a new importer that asks for `postcss` re-resolves the existing consumers to the newest
  match (css-loader and others moved from 8.5.23 to 8.5.31, with vue and nanoid moving along). The importer therefore
  names `postcss` 8.5.23 and `@vue/compiler-sfc` 3.5.43, versions the lockfile already holds. After a change, restore
  the lockfile of the merge base, add the importer by hand if needed, run `pnpm install --lockfile-only`, and check
  that `git diff <merge base> -- pnpm-lock.yaml` has no removed line. jscodeshift is a new dependency that needs team
  sign-off before the package leaves draft.
- `package.json` `files` limits the package to `bin`, `src`, the manifests, `rules/**`, and `custom/**` of every version,
  and the README. Tests, fixtures, tools, and the generated diffs stay out. After a change to it, run `npm pack
  --dry-run --json` in a copy of the package outside the monorepo.
- **Method rules have no type information, so the receiver is the safety story.** `methodMove` rules use
  `receiver: "instance"`: a call is rewritten only on a receiver that `isInstance()` confirms. An unconfirmed receiver
  gets a `manual` entry only when its name is on a short grid-name list (`GRID_NAME` in `methods.mjs`: `hot`, `grid`,
  `table`, ...). A generic receiver (`editor.undo()`) stays silent, because `undo` and `redo` are common names. A
  receiver that is already a `via` call (`x.getPlugin('undoRedo')`) is never rewritten, which keeps the rule
  idempotent. A rule has no list of names that rewrite on any receiver: `isUndoAvailable()` is a valid call on the
  plugin, so such a rewrite would break working code.
- **`receiver: { plugin }`** (`methodRemove` and `methodMove`, and `context.receiver` of `optionRename`) names the
  plugin key or keys the receiver must be. `isPluginReceiver(path, keys)` in `lib/hot-bindings.mjs` says yes for
  `<x>.getPlugin('<key>')` (any `x`, optional chaining included) and for a variable or `this` member that the file
  sets from such a call, one hop, when every value of the name is a listed plugin. Anything else is never edited. A
  report `manual` happens only when the receiver is unresolved (`isUnresolvedReceiver()`: a global, a parameter, or the
  result of another call) and is not `this`, `super`, a member chain rooted at one, a local object or class, an import,
  or the plugin of another key. `18.0.0/resize-state-methods` uses it, so `storage.saveManualColumnWidths()` and
  `super.loadManualRowHeights()` stay untouched. `receiver: "any"` remains for a `methodRemove` rule whose names are
  unique to Handsontable, and it skips a name the file declares itself.
- A `methodRemove` rule's `message` may use `{name}` for the method (`name()`). The report entry and the TODO then lead
  with it instead of "`name()` is removed", which is wrong for a deprecated no-op (`18.0.0/resize-state-methods`).
  Keep that lead under 40 characters, so the TODO still gets the next sentence that says why the call was kept.
- `methodRemove` deletes a call only when it is a whole expression statement (`await` and `void` allowed), the call
  has no arguments, and the receiver chain is made of identifiers, `this`, member reads, and `getPlugin('<literal>')`
  (`isSimpleReceiver()`): `createGrid().getPlugin(...)` and `(await init()).getPlugin(...)` keep the call, because the
  statement has effects of its own. The comments of a removed statement are never dropped (`pruneKeepingComments()`):
  they move to the next statement, else the previous one, else the enclosing statement, and a license header on the
  first statement survives. A used result, an arrow expression body, and the body of a braceless `if` or loop keep the
  call and get a TODO on the enclosing statement. A removal can leave an empty block, which stays.
- `methodMove` rule shape: `methods` maps the old name to the new one, `via` is the call that reaches the new home,
  `properties` lists names that become the `via` call (`undoRedo: null`). Optional chaining is kept by building the
  new links as optional-chain nodes: the first link takes over the `?.`. Computed access (`hot['undo']()`),
  assignment targets, references without a call, and destructuring are reported, never rewritten.
- `callUnwrap` resolves the callee through `resolveNamespaceMember` or a `const` alias (`const { sanitize } =
  Handsontable.helper`). The 17.1 exports map has no `handsontable/helpers/*` entry, so a named import of the helper
  never existed and is not handled. The alias declaration is left in place.
- Import and type rule shapes (`rules/imports.json`, `rules/types.json`). `importSource`: `from`, `exports` (name to
  `{ to, note }` or `{ removed: true, advice }`; `to` is a module or a list of candidates), optional `fallback` entry
  for unlisted names, and `moduleRemoved` (report every namespace import, `export *`, dynamic import, and `require`
  of the module, not only the ones that name an entry of `exports`). `exportRename`: `source` (module or list), `from`,
  `to`, optional `toSource` (module or candidates) and `note`. `namespaceType`: `from` (path or list, `*` is one
  segment), `to: { name?, source }` or `removed: true` with `advice`, `positions` `type` (default) or `any`.
  `exportRemoved`: `source` (module, list, or `handsontable/plugins/*`), optional `except`, `name` (or list), `advice`.
  Advice placeholders: `{plugin}`, `{optionKey}`, `{name}`, `{source}`. `optionKeys` maps a plugin to its option key
  (default: the plugin name with a lower-case first letter, `null` for a plugin with no option, which then uses
  `noKeyAdvice`). Within one run the first matching rule wins for `exportRemoved` and `namespaceType`, so a specific
  rule goes before the wildcard, or the wildcard lists it in `except`.
- The four transforms never delete a name they cannot replace. `importSource` leaves a removed name in a residual
  import from the old module with one TODO per declaration, `exportRemoved` keeps the import and adds a TODO, and a
  removed `namespaceType` member gets a TODO on the enclosing statement or member. A name collision, a global
  `Handsontable`, a re-export, a namespace import, and a destructured `require` are reported `manual` and left alone.
  A `namespaceType` rewrite adds only `import type` for a type position and a value import for an `any` position, and
  it does so before type-only ones, so a value use does not collide with an earlier type import of the same name.
- `test/type-rules.test.mjs` checks the 18.0.0 rules against `versions/18.0.0/exports-diff.generated.json`: every
  removed export and every removed type member of the `Handsontable` namespace must be matched by a rule, or sit in
  the commented allowlist of that test. Regenerate the diff with `tools/derive-type-map.mjs` before a new major.
- A `.d.ts` module exports every top-level declaration unless it has an `export {}`, so the 17.x typings leaked names
  such as `_OperationType`, `PageSizeOption`, and `NumbroFormatOptions`. They count as removed exports in the diff and
  have rules. The 17.1.0 typings also declared the theme registry (`registerTheme`, `mainTheme`, ...) on the `handsontable`
  and `handsontable/base` entry points although the runtime exported them only from `handsontable/themes`.
- Rules whose guide has no section (`18.0.0/core-undo-methods`, `18.0.0/export-column-headers`) omit `guide`: the
  anchor must exist on the page of the manifest. The core undo methods were already gone from runtime and typings in
  17.0, so that rule is a cleanup that belongs in a 17.0 manifest, which does not exist. The `columnHeaders` export
  option is deprecated in 17.1 and removed in 19.0, and only the 19.0 guide has a section for it.
- **`detect` rule shape:** `{ id, kind: "detect", severity?: "manual" | "warning", files: ["js" | "css" | "template"],
  requires?: "hot-file" | "option-object" | "none", emitsFact?, unlessFileMatches?, mergeKey?, match, message, guide }`.
  `message` and `files` are required by `validateDetectRule()`, which runs when the manifests load (the shape check
  only requires `match`). `unlessFileMatches` is a regex on the part text, and `mergeKey` makes the reports of two
  rules on one line collapse into the later one. `requires` defaults to
  `hot-file`: a js part must import or use Handsontable. `option-object` makes `property` and `hook` matchers sit in
  an object `findOptionObjects` finds, or on a wrapper element. It never applies to css or template parts.
  `match` is one matcher object, `{ anyOf: [...] }`, or `{ allOf: [first, ...gates] }` (the first reports, the others
  must match somewhere in the part).
- **`detect` matchers** (js only unless noted): `import` (module or `module/...`, import, re-export, `require`,
  `import()`), `property` (dotted path; `withKey`, `valueMatches` on literal strings only, `valueIs` for the other
  values: `true`, `false`, `null`, `"array"`, `"function"`, `"object"`, `in: "option-object"`),
  `call` (`argMatches` reads every string inside the arguments, `receiver` is `"instance"` or the receiver text),
  `hook` (option key, JSX prop, `addHook`, `addHookOnce`, `Handsontable.hooks.add`/`once`), `string`, `selector` and
  `regex` (also css and template), `missingOption` (`whenAnyKey`, `whenValueMatches`, `unlessFileMatches`). `selector`
  tests stylesheet rule selectors, js strings, and raw template text. SCSS nesting is not resolved.
- **`missingOption` looks only at configurations the file builds:** `new Handsontable(el, {...})` (also through one
  variable) and `<HotTable>` elements with their `settings`. Not `updateSettings()` (the license key is read once),
  not annotated or spread objects, and nothing hidden behind a spread, a computed key, or an unresolved `settings`.
- `namespaceMember` matches a read of `Handsontable.<path>` (called or not) through the file's own binding. It does not follow
  a destructured alias. `18.0.0/helper-typings-only` uses it: the ten `Handsontable.helper` functions that the 17.1
  typings declared (`error`, `hasCaptionProblem`, `info`, `isIE`, `isIE9`, `isMSBrowser`, `isValidDate`, `log`,
  `toSingleLine`, `warn`) were never set on the runtime object in 17.1.0 or 18.0.0, because `index.js` fills
  `Handsontable.helper` from a fixed module list that leaves out `helpers/console` and `helpers/templateLiteralTag`.
- A `detect` rule reports up to `COLLAPSE_AFTER` (5) matches per part, then one entry that carries the count and
  every line in `lines` (the renderers print `Lines: 3, 9-11`). A Vue file has several parts, so the limit is per
  part. The Vue adapter's `skippedBlocks` do not reach `ctx`: the runner turns the `relevant` ones into
  `skipped-file` warnings itself. The js precheck also skips a test file that never says `handsontable`, and an
  inline `<script>` or `<style>` of an `.html` file is raw text for `selector` and `regex` only.
- The `property` matcher also reads a `template` part (list `template` in the rule's `files`): attributes of
  `<hot-table>`, `<hot-column>`, `<HotTable>`, and `<HotColumn>` whose name binds the first segment of the path, in
  either case style, and `settings` or `v-bind` bindings that name it as a word. In js it also matches assignments and
  `setCellMeta()`/`setCellMetaObject()` in a hot file. `siblingKey` (one-segment path) wants the object or element
  to set another key too (`pattern` beside `culture`), and `annotatedObject` finds an object literal that a type
  annotation, `as`, or `satisfies` names. Neither reads templates.
- Dependency ranges (`planRange()`, `rangeAdmits()`): a compound or open range that already allows the target
  (`>=17.1.0 <19`, `*`, `18`, an `npm:` alias to a new enough version) is `keep` and produces no entry. A simple caret,
  tilde, or exact range whose lowest version is below the target is raised to the target, even when it admits it
  (`^18.0.0` becomes `^18.1.0`), because the user asked to migrate to that version. A range is never lowered. `dependencies.mjs` also reports, never
  edits, `overrides`, `resolutions`, `pnpm.overrides`, `npm:` aliases under another name, and pinned CDN URLs in
  `.html` pages (a `template` scan of the `dependency` module) that sit below the target. Every entry carries a
  `mergeKey`, so a chain 17 to 18.1 reports one net entry per spot.
- **The `18.1.0/sanitizer-*` custom rules are report-only and find the sanitizer by function, not by name:** a
  `sanitizer` property of an option object or a `<HotTable>` prop, whose value is a function written there or a
  same-file function the option names. `Handsontable.dom.fastInnerHTML()` still defaults its `context` to
  `'innerHTML'` in 18.1 (and did in 18.0), so a sanitizer the project also passes there without a context still
  receives it, and the guide's "delete the `'innerHTML'` branch" would change that call. The rules never edit. They
  report each test of the source argument against `'innerHTML'`, with a "delete it" wording when the function
  already handles `'header'` in the same `||` chain or fall-through group, and once per function that reads its source
  argument (dialog content is now `'dialog'`, not `undefined`). `sanitizer-new-sources` reports a function that reads
  its source or looks like it escapes HTML.
- `18.1.0/pikaday-theme-leftovers` reads `css` and `template` parts, so the inline `<style>` of an HTML page is
  covered (class attributes are not: the rule looks for `.pika-single`, `.pika-next`, and `.pika-prev` selectors).
  `unlessFileMatches: "pikaday"` skips a stylesheet or a page that mentions `pikaday`, such as a `<link>` or `<script
  src>` that loads Pikaday itself. It shares `mergeKey: "pikaday"` with `18.0.0/pikaday-leftovers`, so a chained run
  reports one entry per spot.
- **Facts carry a location.** `addFact(ctx, name, line)` also adds `site:<name>@<dir>=<file>:<line>` for the first sighting
  in a directory, and `factSite()` reads it by the nearest-package rule of `hasFactFor()`. The set stays a set of strings.
  `reportMissing` items take `range` (what 17.1.0 shipped: `numbro` 2.5.0, `moment` 2.30.1, `@handsontable/pikaday` ^1.0.0,
  `dompurify` ^3.1.7); the message names the importing file and line and suggests the range, and the tool never adds it.
- `importSource` rule fields beyond the table: `runtimeAdvice` (what to say about a dynamic `import()` or `require()` of a
  module that had no runtime code), `reason` (appended to each move; `{name}` and `{from}` expand), and per export
  `neverExported: true` (kept so a broken named import is still redirected, left out of messages). `exportRename` and
  `namespaceType` take `reason` too. `cssVariable` takes `zeroAdvice` (value `0`, `0px`, or `none`) and `scopedAdvice` (a
  Vue `<style scoped>` or `<style module>` block, or `*.component.css|scss`). A manifest takes `inlineScriptChecks`, short
  phrases that the note about an inline `<script>` lists after "Check by hand:". The `missingOption` matcher also reads the
  inline scripts of an HTML page by raw text (`matchInlineMissingOption()`): a `new Handsontable(` call that holds an object
  literal and never names the key.
- **The sanitizer facts, from the 18.0.0 and 18.1.2 tarballs.** 18.0 sent the rendered header to the sanitizer as `'header'`
  (`tableView.js`) and the offscreen pass that measured nested header widths as `'innerHTML'` (`ghostTable.js`), and dialog
  content with no source (`(html, ctx) => sanitizer(html)`). 18.1 sends `'header'` from both header paths, `'dialog'` for
  dialogs, and adds `'password'`, `'CopyPaste.paste.sourceData'`, and `'CopyPaste.paste'`. `fastInnerHTML()` still defaults
  its context to `'innerHTML'`. So an `'innerHTML'` branch is dead for the grid in 18.1, and moving its body to a `'header'`
  branch would change what rendered headers show against 18.0. The `sanitizer-source` entry has three shapes (`same-place`,
  `elsewhere`, `none`). `sanitizer-new-sources` stays quiet for a function that returns one sanitizing call on its content
  argument and for one whose default path returns the content unchanged (`passesOtherSourcesThrough()`).
- Detect negative fixtures must pass the adapter precheck, or they prove nothing: put the word Handsontable in a
  comment. `report.json` is matched as a subset, so `test/detect.test.mjs` asserts the empty reports.

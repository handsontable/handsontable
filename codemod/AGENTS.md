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
| `src/lib/todo.mjs` | The only writer of TODO comments: `shortenAdvice()`, `formatTodo()`, `addJsTodo()` (a `//` comment, or a JSX comment for a `JSXElement` path), `addCssTodo()`, and `collectComments()` for the dedupe. |
| `src/lib/anchor.mjs` | Where a comment about a property can go: `enclosingAnchor()`, `hasOwnLines()`, `anchorForProperty()`. |
| `src/lib/option-sites.mjs` | `templateOptionSites()` (wrapper tag attributes in template text) and `dynamicOptionSites()` (assignments and `setCellMeta()`), shared by `options.mjs` and the `detect` `property` matcher. |
| `src/adapters/unsupported-style.mjs` | `.less`, `.styl`, `.stylus`, `.sass`: never parsed, only reported through `skipReason`. |
| `src/lib/safety.mjs` | The meaning of `safe`: `rewrites(rule)`, `modeOf(rule)`, `requiresSafe(kind)`, `reportInstead()`. |
| `src/lib/facts.mjs` | `addFact(ctx, name)` and `hasFactFor(ctx, name)`: facts keyed by name and directory. |
| `src/lib/dependency-range.mjs` | `planRange(spec, target)`: rewrite, keep, skip, or report a `package.json` range. |
| `src/transforms/import-source.mjs`, `export-rename.mjs`, `namespace-type.mjs`, `export-removed.mjs` | `importSource`, `exportRename`, `namespaceType`, and `exportRemoved` (rule shapes in Traps). |
| `src/lib/type-rules.mjs` | Shared by those four: `*` module and path patterns, option keys and advice placeholders, `chooseSource()` (which candidate module a name is imported from), `reportOpaqueReferences()`. |
| `src/transforms/methods.mjs`, `call-unwrap.mjs` | `methodRemove` and `methodMove` (receiver rule, see Traps), and `callUnwrap`. |
| `src/transforms/options.mjs` | `optionRename`, `optionMove`, `optionRemove` on option objects, wrapper attributes, and `context.callArg` arguments (see Traps). |
| `src/transforms/dependencies.mjs` | The `dependency` kind: range bumps, `add`, `reportOnly`, `replaced`, and `facts`. `matchesWhen(j, root, when)` is the fact matcher. |
| `src/report.mjs` | `Report` (dedupe, `scope: 'run'` entries kept once with their `files`, ordering by version then rule id), `renderConsole()`, `renderMarkdown()`, `summaryLine()` (both renderers print it), `SKIPPED_RULE_ID`. |
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
2. The git guard refuses a dirty tree (exit 2) unless `--allow-dirty`. It does not apply to `--dry-run`,
   `--list`, `write: false`, or a directory outside a git repository, where `onWarning` gets a one-line notice before
   the first write. An untracked file at the `--report` path (`reportPath`) is not a change.
3. `discover()` lists files (`git ls-files -z --cached --others --exclude-standard`, or an fs walk), drops
   `node_modules`, `dist`, `build`, `coverage`, `.git`, `*.min.*`, `*.d.ts`, files deleted on disk, and any
   extension no adapter handles. JSON is limited to `package.json`. A file named on the command line bypasses the
   generated-output filter.
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
| `report(entry)` | Add `{ ruleId, severity: 'changed' or 'manual' or 'warning', line?, message, lines?, scope?, mergeKey? }`. The runner fills `file`, `guideUrl`, and adds the part's `lineOffset` to `line` and `lines`. Identical entries collapse. `lines` lists every match of a collapsed group, and the renderers print them. `scope: 'run'` marks a note that is the same in every file (a rule's `note`): the `Report` keeps it once with the list of files, under "Read once". A later entry with the same `mergeKey` in the same part replaces the earlier one, so two migration steps that touch one spot report the net result once. |
| `todo(target, ruleId, text, comment?)` | Leave `TODO(handsontable-codemod <ruleId>): <first sentence of text> See <guide link>` before a js node or path or a postcss node, once, and add a `manual` entry with the whole `text`. `comment` replaces `text` as the source of the comment when the caller has a better short form. The link is added only for a rule with a `guide` anchor. Returns whether a comment was inserted. It calls `markChanged()` itself. `json` gets the entry only. A NodePath of a `JSXElement` or `JSXOpeningElement` gets a JSX comment `{/* ... */}` before the element (or before the expression that holds it) when the element is a child of another element, else a `//` comment on the enclosing statement when it starts at most 3 lines above, else on the element's first attribute. |
| `facts` | A `Set` shared across the run. Add `uses-formulas` style keys in phase 1, read them in phase 2. |
| `options` | `{ aggressive, dryRun }`. Never write to disk from a transform. |
| `markChanged()` | Call after every edit of `root`. An untouched part is never printed, so the file keeps its exact bytes. |

Report line numbers are one-based and relative to the part's own source. The `todo` entry is reported on every
run, while the comment is inserted only once: idempotency means zero changed files, not zero entries.

Rules for transforms:

- Rewrite only what is certain. When there is no type information, report instead of guessing.
- Never insert a sanitizer, and never insert or invent a license key.
- Do not mention tickets, tasks, or reviews in comments. Cite code by a greppable symbol, not by a line number.
- Edit `root` in place, report every edit as `changed`, and leave every other byte alone.

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

## How to add a version

1. Create `versions/<major.minor.patch>/manifest.json` with `version` (equal to the directory name), `status`
   (`released` or `draft`), `guide: { url, source }`, and `rules`. `guide.source` is the repository path of the
   migration guide page. `guide.url` is `https://handsontable.com/docs/javascript-data-grid/<permalink>`
   without a trailing slash, with the permalink read from the guide's frontmatter.
2. Give each rule an id `<version>/<slug>`, a `guide` anchor that exists on the page, and `safe` (a boolean, except on
   `detect` and `exportRemoved` rules). Add the rule to the counts in `README.md`.
3. Add fixtures (below). `manifest.test.mjs` already checks that every manifest loads, ids are unique and
   prefixed, and the guide source file exists.

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
- compares `report.json`, an array of `{ ruleId, severity, line? }`: every expected entry must match a distinct
  actual entry on the fields it names, and extra actual entries are allowed;
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
  `lang`), a `css` part per `<style>` (`css`, `postcss`, `scss`), and a `template` part with `root = { content }`.
  `lineOffset` is the zero-based line of the block content start, which is the tag's line, so part line 1 is the tag
  line. Parts carry `start` and `end`, and `print` splices changed parts back last to first. A script or style block
  without a match for the `js` or `css` precheck gets no part, and `less`, `stylus`, `sass`, and `src=` blocks are
  listed in `handle.skippedBlocks`. A transform edits a template by assigning `root.content` and calling
  `markChanged()`.
- `cssVariable` and `themeToken` rules are a rename (`from`, `to`) or a removal (`from`, `removed: true`, `advice`).
  `RULE_KINDS` cannot express "`to` or `removed`", so the transforms throw on a rule with neither and
  `test/styles.test.mjs` pins the shipped rules. `themeToken` rewrites keys only inside the arguments of
  `registerTheme`, `reinitTheme`, and `.params()` (a rule can set `callees`); `createTheme` is not public API.
- A guide anchor on the docs site drops the list number: `## 6. Update theme wrapper border variables` is
  `#update-theme-wrapper-border-variables`, not the old `#_6-...` form.
- Option rules (`options.mjs`): a rule rewrites an object when its confidence from `findOptionObjects` reaches the
  rule's `minConfidence` (default `high`, `--aggressive` lowers every rule to `medium`); below the bar the key is
  only reported. `medium` objects exist only in a file that imports or uses Handsontable (`isHotFile`), so a file with
  none is never edited, even under `--aggressive`. A `heuristic` object also needs `corroborated()`: at least two known
  option names besides the key the rule acts on (`ownKey()`), one of them outside `GENERIC_OPTIONS`. So
  `{ locale, numericFormat: {...} }` and `{ correctFormat, datePickerConfig }` stay reports in a hot file. A
  template part and the assignment forms are only reported (`reportTemplateOptions()`, `reportDynamicOptions()`,
  both fed by `lib/option-sites.mjs`). A removed JSX attribute puts its TODO next to the element (see `todo()`). Rule shapes: `optionRename` `{ from, to, context?: { callArg: [method names] } }` (with `callArg` it
  acts on object-literal arguments of member calls, whatever the finder says); `optionMove` `{ from: "<option>.<key>",
  to, report? }` (`to` is a sibling of `<option>`, the key lands before `<option>`); `optionRemove` `{ name, todo?,
  advice }` (`todo` defaults to true). Edits splice `properties`, so recast reprints the whole object: expect a
  blank line before a commented property and an expanded one-line object. Anchor a TODO only on a property,
  statement, declaration, or array element, never on an object after `return`, where `return // c` ends the
  statement. Removing the property that carries a TODO moves the TODO on, so rules sharing an object lose none.
  The `advice` never says the property was deleted, because the rule may not be safe. The comment of a deletion starts
  with `Deleted <name> here.`. A rule that is not safe leaves the property and puts the TODO before it (before the
  enclosing property, statement, or array element when the object is on one line).
- The `json` adapter prints with `JSON.stringify`, keeping indent, line ending, and trailing newline. Other
  formatting of an edited `package.json` is normalized.
- Adding the package changed `pnpm-lock.yaml`. jscodeshift is a new dependency that needs team sign-off before the
  package leaves draft.
- **Method rules have no type information, so the receiver is the safety story.** `methodMove` rules use
  `receiver: "instance"`: a call is rewritten only on a receiver that `isInstance()` confirms. An unconfirmed receiver
  gets a `manual` entry only when its name is on a short grid-name list (`GRID_NAME` in `methods.mjs`: `hot`, `grid`,
  `table`, ...). A generic receiver (`editor.undo()`) stays silent, because `undo` and `redo` are common names.
  `anyReceiver` lists names distinctive enough to rewrite anywhere in a Handsontable file. Keep plugin methods out of
  it: `isUndoAvailable()` is a valid call on the plugin, so a rewrite on any receiver would break working code. A
  receiver that is already a `via` call (`x.getPlugin('undoRedo')`) is never rewritten, which keeps the rule
  idempotent. `methodRemove` with `receiver: "any"` removes a name unique to Handsontable on any receiver, but skips a
  name the file declares itself (a class that defines `saveManualColumnWidths()` is calling its own code). No method
  rule touches a file that `isHotFile` rejects.
- `methodRemove` deletes a call only when it is a whole expression statement (`await` and `void` allowed), and drops
  the comments attached to that statement. A used result, an arrow expression body, and the body of a braceless `if`
  or loop keep the call and get a TODO on the enclosing statement. A removal can leave an empty block, which stays.
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
- Rules whose guide has no section (`18.0.0/core-undo-methods`) omit `guide`. The core undo methods were already gone
  from runtime and typings in 17.0, so that rule is a cleanup that belongs in a 17.0 manifest, which does not exist.
- **`detect` rule shape:** `{ id, kind: "detect", severity?: "manual" | "warning", files: ["js" | "css" | "template"],
  requires?: "hot-file" | "option-object" | "none", emitsFact?, match, message, guide }`. `message` and `files` are
  required by `validateDetectRule()` (the manifest validator only requires `match`). `requires` defaults to
  `hot-file`: a js part must import or use Handsontable. `option-object` makes `property` and `hook` matchers sit in
  an object `findOptionObjects` finds, or on a wrapper element. It never applies to css or template parts.
  `match` is one matcher object, `{ anyOf: [...] }`, or `{ allOf: [first, ...gates] }` (the first reports, the others
  must match somewhere in the part).
- **`detect` matchers** (js only unless noted): `import` (module or `module/...`, import, re-export, `require`,
  `import()`), `property` (dotted path; `withKey`, `valueMatches` on literal strings only, `in: "option-object"`),
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
- Dependency ranges (`planRange()`, `rangeAdmits()`): a range that already allows the target (`>=17 <19`, `*`, `18`,
  an `npm:` alias to a new enough version) is `keep` and produces no entry. `dependencies.mjs` also reports, never
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
- Detect negative fixtures must pass the adapter precheck, or they prove nothing: put the word Handsontable in a
  comment. `report.json` is matched as a subset, so `test/detect.test.mjs` asserts the empty reports.

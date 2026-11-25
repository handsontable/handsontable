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
- Test: `npm run test --prefix codemod`. CI runs it in the `Codemod tests` step of `lint.yml`, job `core`, and only when
  the codemod scope changed or on a run-all (`inputs.run-codemod`): the suite takes about a minute of CPU and that job is
  on the critical path of every pull request. The `codemod` job of the same file adds Node 20 and 24 on Linux and Node 22
  on Windows, and `checks.yml` includes `pnpm-lock.yaml` and the migration guides (`docs/content/guides/upgrade-and-migration/`)
  in the scope, so a Dependabot bump or a renamed guide heading runs the matrix. `lint.yml` runs only on a pull request, so
  `develop.yml` has its own `codemod` job (the same legs plus the Linux leg on the Node of `.nvmrc`), gated on the
  `test-codemod` flag or a manual dispatch and not on run-all. The job is advisory (`continue-on-error`, plus a warning annotation and a job summary on failure): a red
  run does not fail the Develop run, so it cannot hold the `experimental` publish. On a pull request the suite is a real
  gate. `codemod/test/workflow-gates.test.mjs` and `.github/scripts/__tests__/codemod-workflow.test.mjs` pin it. Only
  the second runs in every pull request (the root `test:tooling`), so it holds the gates of `lint.yml` (the gated
  `Codemod tests` step and its prefix, the `codemod` job, its `if`, its three legs, `fail-fast`, the install filter),
  the `run-codemod` input, and the `test-codemod` filter; a pull request that edits only a workflow is checked by it.
  The filter also names the core sources that a codemod test reads (`hooks/constants.ts`, `metaSchema.ts`,
  `numericRenderer/utils.ts`, `exportFile.ts`) and the root `LICENSE.txt`: add a path there when a test reads a new one.
- `test/option-object-gate.test.mjs` pins `requires: "option-object"`: for every `detect` rule that sets it (a table
  with one entry per rule, checked against the shipped manifests in both directions) a grid object that sets the key is
  reported, and a plain object of the project that sets the same key in a file that also creates a grid is not. A new
  rule with the gate adds a sample there.
- `test/other-receivers.test.mjs` pins the claimed objects (every report path ignores an object that `updateSettings()`,
  `setCellMeta()`, or `setCellMetaObject()` of another receiver takes, and keeps an unresolved receiver) and the
  `receiver: "grid"` call matcher of `19.0.0/update-settings-data-provider`.
- The `test` script lists its files literally. `test/test-list.test.mjs` fails until the list and the `test/`
  directory name the same `*.test.mjs` files, so a new test file must be added to the script.
- Smoke test: `node codemod/bin/handsontable-codemod.mjs migrate --list --from 17 --to 18.1`. The last line counts the
  rules that rewrite and the rules that only report.
- `test/cli.e2e.test.mjs` spawns the real bin on a temp git project built by `test/helpers/sample-project.mjs`
  (`SAMPLE_FILES`, `createSampleProject()`). Add a file kind there when a transform starts to handle one.
  A test removes its project with `removeSampleProject()` in a `finally`, and the process removes what a test forgot when it
  ends. `CODEMOD_KEEP_PROJECTS=1` keeps every sample project and prints the paths, for a look at a failing test.
- `test/runner.test.mjs` holds the clean-tree guard to every way a tracked project can be dirty (an edited file, a staged
  edit, a staged new file, `git mv`, a deleted file, an untracked file, each with exit code 2 and no byte changed), the
  exit code 1 of a parse, transform, and read error with the good files still migrated, and `KIND_ORDER` as the docs
  give it (with a detect rule that must see what a rewrite of the same version wrote). `test/cli.test.mjs` holds the
  crash path of `main()` (a throw that is not a `UsageError` exits 1 and prints the stack, also after files were written).
- `test/readme.test.mjs` compares the rule counts in the README tables with `describeRules()`. A change to a rule's
  `safe`, or a new rule, changes a count, so update the two tables in `README.md`.
- `test/safety.test.mjs` pins the `safe` contract: the runner guard, the shipped data, one case per kind that flips
  its rules to `safe: false`, and a sweep that flips every rule of a manifest for every fixture input. Both expect
  reports and TODO comments only, and no `transform-error`.
- `test/idempotency.test.mjs` runs one-line shapes of every TODO-emitting kind three times. A new kind that leaves a
  TODO adds a one-line case there. Its last block sweeps every fixture input of every manifest, drafts included, twice
  (with the rules of the fixture, and with every rule of the manifest): run 1 of the fixture's rules gives the committed
  output, run 2 changes no file, no rule reports more in run 2 than in run 1 (a rule that reads its own marker as a
  second spot), and a `detect` rule reports exactly as many in every run. A `changed` entry is left out of the counts,
  and a rewrite can drop the note about its own spot, so only a `detect` rule is held to equality. A run that changed
  nothing hands the same text to the next one, and `transformFile()` is a pure function, so the sweep does not repeat
  it: run 3 is run only where run 2 changed the text. Keep it that way, because this file was the longest in the suite.
- `test/idempotency-nested.test.mjs` is the three-run matrix for a call that shares its line with other code: wrappers
  (function, method, arrow with a block, object method, Vue options object, `if` block, callback argument, immediately
  invoked function, nested twice, arrow in a property, a block that is a statement of its own (alone, nested, in a function,
  in a `switch` case), and the statements without braces: `for`, `while`, `do`, `if`, `else`, a label) times the kinds of TODO (a method call, a removed option in a one-line array element, an option kept
  next to a custom reader, a JSX element) times the neighbor layouts (statements before and after, a one-line object
  that the run edits before and after). Every shape runs three times and must change nothing in runs 2 and 3. A new
  kind that leaves a TODO adds a body there, with a plan of its own rule and the rule that edits the object
  (`planFor()`), which keeps each run cheap. A body that is a declaration says `declaration: true`, because a
  statement without braces cannot hold one.
  The bodies `methodRemove kept: the result is used` and `methodRemove: a bare call` reach the statement carriers: the
  first leaves a TODO on a statement, the second is kept with a TODO by a wrapper without braces and cut out of the text
  by a block (`removedInBlocks`).
- `test/statement-carriers.test.mjs` pins a TODO on a statement of one line: the exact output for every statement kind
  (js, ts, tsx, and a js shape in a ts and a tsx file), inside a function indented with spaces and with tabs, in CRLF,
  mixed endings, a file with no line break at its end, after a shebang, a directive prologue, a license comment, and a byte
  order mark, in a Vue `<script setup>` and `<script>`, with a trailing comment, below a next-line directive, two TODOs,
  a later rule that rewrites the statement, a TODO that moves with an import, a twin chain, and the shapes that stay with
  the printer. Each runs three times. It runs fake rules through `createRegistry()` (the texts never say Handsontable,
  so the fake transform has a `rescue()`), and the failure paths through `hooks.afterCommit`.
  `test/statement-removal.test.mjs` pins the cut of a removed statement, with the whole output text, and
  `test/import-removal.test.mjs` the cut of an import that was merged into another (one-line neighbors, blank lines,
  comments, CRLF, a byte order mark, a license comment, a shebang, three runs each).
- `test/receiver-history.test.mjs` is the table behind the receiver rule (see Traps): for every rule that rewrites on a
  receiver (a method move on an instance, a method removal on a plugin, an option rename in the argument of a plugin call,
  an option removal in the object of `setCellMetaObject`, a theme token rename) it runs the same histories of the name
  (`const`, a later assignment in a branch or a closure, a destructuring target, a `for` head, a parameter, a shadowing
  `var` in a namespace or a static block, a `this` member set in a nested object, a nested function, or a getter) and
  expects a rewrite for a name whose every value qualifies and none for any other. A rule on a plugin also gets the
  histories of a name that holds two plugin keys (`otherPlugin`), because every value must be the plugin the rule
  needs, not only a plugin. It also runs the writes of a `this`
  member from outside its class (`a.r = v`, `a['r'] = v`, `Object.assign(a, { r })`, a subclass, a field of another
  class, `defineProperty`), and has a block for `.hotInstance` (the wrapper shapes that must still rewrite, and the
  definitions that end the trust) and one for the host of `getPlugin()` (an instance, a name like a grid, a global, a
  local object, an import).
  `test/numeric-format-culture.test.mjs` pins the levels of the `numeric-format-culture` move and its note,
  `test/shared-objects.test.mjs` the uses of a variable that hold an object and the spreads, and
  `test/custom-reader.test.mjs` pins the custom reader check, `test/jsx-todo.test.mjs` the JSX text guard, and
  `test/scope.test.mjs` `referenceSpace()` and the hoisting of `var`.
- `test/leading-trivia.test.mjs` pins the start of a printed file (see Traps, "What stands before the first statement"):
  a shebang, a byte order mark, a license comment, `// @ts-check`, and a directive prologue come out of a rule that merges or
  removes the first statement as they went in, in LF and CRLF, and a lost comment or directive fails the file.
- `test/encoding.test.mjs` (a non-UTF-8 file of every kind is skipped with its bytes kept, a byte order mark stays in a
  script, a stylesheet, and a `package.json`, a file that cannot be written is a `write-error`),
  `test/redaction.test.mjs` (a token in a dependency spec never reaches the console, the report file, `--dry-run`,
  or standard error), `test/report-target.test.mjs` (a `--report` target is checked before any file changes, and a
  report that fails after the run does not hide the summary), `test/git-config.test.mjs` (a repository whose
  configuration names a program for `core.fsmonitor` or a pager runs none, and `GIT_DIR`, `GIT_WORK_TREE`, and
  `GIT_INDEX_FILE` in the environment of the run, as a git hook sets them, do not point the guard at another repository;
  `GIT_PREFIX` has no effect on the commands the tool runs that a test can see), and `test/scan-complexity.test.mjs` (the
  `<script>` scanner and `blankToolComments()` return what the expressions they replaced returned, on random text, and
  four times the adversarial text is four times the work, counted and not timed: see below) are the CLI-level pins. They spawn the real bin through
  `test/helpers/plain-project.mjs` (`inPlainProject()`, `migrate()`).
- `test/scan-complexity.test.mjs` counts, it never times. `test/helpers/work-meter.mjs` (`measureWork()`,
  `measureGrowth()`) wraps the methods of `String.prototype` and `RegExp.prototype` and adds up what each call reads or
  copies, so a scan that starts again for each item grows with the square of the input and a linear one with the input
  (four times the text must cost at most five times the work). It cannot see a loop that indexes a string or a
  catastrophic pattern, so `scanScripts(source, stats)` also reports its own steps, and a pattern that backtracks is
  held by the comparison with the expression it replaced. A new scanner adds its adversarial shapes there, at the
  small sizes the counts need (a quadratic scan must fail the count and not read a megabyte first). A wall-clock limit
  fails a loaded runner and passes a regression that is only a few times slower, so none belongs in this suite.
  A walk of the syntax tree is counted too (`countTraversals()` wraps `PathVisitor#visit` of ast-types), because the work
  meter cannot see it: the tests compare a part with 2 and with 20 copies of each detect matcher, and a file with 10 and
  with 80 grids that each spread a different constant. A test of a very long line proves the file was not read by a
  syntax error that would show as a `parse-error`, never by a clock.
- `test/interrupt.test.mjs` pins Ctrl-C (see Run model, step 6): `run()` with a `signal` finishes the file it is on and
  starts no other (the signal is raised from `hooks.beforeRename`), skips the `package.json` pass, and leaves no temporary
  file; `main()` prints one line on standard error and exits 130; `interruptedLine()` gives the undo advice for git, a dirty
  start (`--allow-dirty`), and no git; and a child process of the real bin gets a real SIGINT (skipped on Windows, where
  `kill('SIGINT')` ends a process without a handler). `test/helpers/slow-rename.mjs` is the `--import` preload that makes
  every `rename` wait, so the run cannot finish before the signal. `test/broken-pipe.test.mjs` closes the read end of the
  standard output of the real bin: a dry run and a run that wrote every file end with no stack trace and the exit code of the run.
- `test/write-safety.test.mjs` pins the write: `writeFileSafely()` (temporary file and rename, the mode kept exactly under a
  umask that would cut it, a file
  that changed after the read refused, a link or a read-only file refused, no temporary file left), a failed or refused
  write not counted as a rewrite, the `resolvesInside()` check at its call site in `run()` (an injected
  `hooks.discover` list that holds a link to a file or directory outside the project, and a file that becomes a link
  between the read and the write), and the `--report` target as the file system sees it (hard link, letter case, an
  existing file of a handled type, a link on the path), and a project reached through another spelling of its path (a link).
  `test/report-target.test.mjs` also holds that a file git tracks, in any directory and spelling, is never the report. `hooks.discover` and `hooks.beforeRename(file)` of `run()` are
  the injection points of these tests and exist for nothing else.
  `test/discovery-guards.test.mjs` pins `findExecutable()` with an injected `PATH`, `PATHEXT`, and file system, git
  started from `PATH` and never from the project, the clean-tree guard under `status.showUntrackedFiles=no`, the ignore
  rules of git as the file list (the global file included), the "No files to migrate." note and its reasons, a project
  that an outer repository ignores, submodules and embedded repositories, the walk's skipped directories outside git,
  and that discovery drops a link on its own. `test/report-text.test.mjs` pins `src/lib/markdown.mjs` and the report
  as text (see Traps). `test/line-endings.test.mjs` pins `src/lib/line-endings.mjs`.
- Every test that spawns git, or runs the tool in a repository, imports `test/helpers/git-env.mjs`, which sets
  `GIT_CONFIG_GLOBAL` to an empty file, `GIT_CONFIG_NOSYSTEM=1`, and `HOME`, `XDG_CONFIG_HOME`, and `USERPROFILE` to a
  directory with nothing in it, for the test process and its children (`isolatedGitEnv()` for an explicit `env`). A
  developer's `core.excludesFile` or `status.showUntrackedFiles` otherwise fails ten tests. A test in
  `discovery-guards.test.mjs` fails for a file that spawns git without it.
- A test that reads a file of the monorepo (a guide, a core source) calls `skipWithoutFile()` or `skipWithoutGuides()` of
  `test/helpers/guide-source.mjs`: it skips outside the monorepo and **fails** inside it, where `IN_MONOREPO` is the
  presence of the root `pnpm-workspace.yaml`. A moved guide must never turn its anchor checks into skips.
  `test/helpers/code-text.mjs` (`withoutComments()`) reads comments the way the language does (the parser of the tool,
  postcss, and the SFC blocks), and `safety.test.mjs` and the fixture sweep for a license key or a sanitizer use it.
- `test/docs-structure.test.mjs` fails on a repeated `# ` title or a repeated `## ` heading in `AGENTS.md` and
  `README.md` (the file was once spliced into itself). `test/docs-page-guard.test.mjs` ties the guide page of the
  codemod to `package.json`: while `private` is `true` the page must open with the "not on npm yet" warning and the
  command that works from the repository, and once `private` is gone the warning must be gone. **Publishing the package
  means removing that warning from `docs/content/guides/upgrade-and-migration/migration-codemod/migration-codemod.md`.**
  `test/workflow-gates.test.mjs` pins what `checks.yml` and `lint.yml` do for the codemod: the lockfile is in the
  `test-codemod` filter, and the `Codemod tests` step of the `core` job runs only on `inputs.run-codemod`.
- `test/detect-comments.test.mjs` pins the comments the tool writes (never matched by a `regex` or an
  `unlessFileMatches`), the `regex` modifiers `in: "strings"` and `code: true`, and the license key rule on every
  shape. `test/draft19-rules.test.mjs` pins the rule-level behavior of the 19.0 draft that a fixture cannot show in
  three runs: variables passed to an export call, aliases of `helper.sanitize`, imports of `Loading` and `Dialog`, the
  menu item places, template attributes, and the names in a TODO.
- `test/literals.test.mjs` pins the literal invariant (see Traps): a matrix of literal shapes in files indented with
  spaces, tabs, and CRLF, the deliberate-edit cases, `guardLiterals()` itself, and a sweep that compares the template
  literals and multi-line strings of every fixture input with its output. It reads literals through
  `test/helpers/literals.mjs`, a plain parser walk that does not use `src/lib/literals.mjs`.
- `test/indirect-sites.test.mjs` pins the code that holds options without showing it: the one-hop resolver, the custom renderer and file-read guards of `numericFormat.culture`, references and spreads as the value, the unrecognized-holder reports, wrapped selectors, indirect column-move hooks, dates from variables, and the marker of an entry inside a template literal.
- A rule for a change that the migration guide does not describe sets `"inGuide": false`. Its entries and TODO comments then carry no guide link (`18.0.0/core-undo-methods`, `18.0.0/export-column-headers`). A rule with neither `guide` nor `inGuide: false` links the guide page without an anchor. A rule that sets both is a manifest error (`validateRule()`).
- `test/manifest.test.mjs` checks every rule's `guide` anchor against the headings of the guide page with
  `checkAnchors()` in `test/helpers/guide-anchors.mjs`, which owns the one slug function of the tests (`anchorsOf()`,
  `anchorListOf()`), and checks the `notAutomated` entries too. `slugOf()` strips inline tags and turns a double hyphen
  into a dash outside a code span, as the site does, and `test/guide-anchors.test.mjs` holds it to the heading ids of
  the built site, kept in `test/helpers/site-anchors/*.json` (one file per migration guide, read from the rendered page,
  never from the Markdown). When a guide gains headings, fetch the built page, extract the ids of its `h2` to `h6`, and
  refresh the file. The test also checks every manifest anchor against these ids (a diagnostic for a draft).
  A missing anchor fails for a `released` manifest. For a `draft` one it is a test diagnostic (a line in the test
  output), because the guide of a draft is still edited by other people and a renamed heading there must not fail this
  package's CI. `test/draft-manifest.test.mjs` pins both halves with a temporary manifest and guide, and also pins
  that a draft stays out of a default run and of the default `--to`, that every `h2` section of the 19.0.0 guide has a
  rule or a `notAutomated` entry and no entry names a section the guide lacks (read from the snapshot of the headings in
  `test/helpers/site-anchors/`, not from the live guide, which other people edit: refreshing the snapshot is what makes a
  new section need a rule or an entry, and the test prints the live guide's distance from the snapshot as a diagnostic), and that every rule of a
  draft is named by the `report.json` of some fixture. `type-rules.test.mjs` reads one guide of its own (the first
  manifest with type rules), so it does not cover a draft. It also holds every module that a type rule writes an import
  from to an entry point the exports diff found a replacement in, and runs each `namespaceType` rule once per `to.source`.
- A test that checks the behavior of a released range builds its plan from `loadReleasedManifests()`
  (`test/helpers/manifests.mjs`), not from `loadManifests()`: the latter includes every draft, and a draft's rules
  would join the run. `idempotency.test.mjs` keeps the draft rules in a plan of their own (`draftPlan`).

## Layout

| Path | Role |
|---|---|
| `bin/handsontable-codemod.mjs` | Entry. Sets `process.exitCode` from `main()`. |
| `src/cli.mjs` | Argument parsing, `--list`, rendering, exit codes. |
| `src/runner.mjs` | `run()` (disk), `transformFile()` (pure), `resolvePlan()`, `describeRules()`. |
| `src/versions.mjs` | Version parsing, range selection, `--from` auto-detect. |
| `src/manifest.mjs`, `src/manifest.schema.json` | Manifest loading and validation, `RULE_KINDS`. `loadManifests()` also fails for a directory of the versions directory that is not named for a full semver version (a dot-directory is ignored) and for a `twins` id that is no rule of any manifest. |
| `src/types.mjs` | JSDoc typedefs for the contracts below. No runtime code. |
| `src/transforms/index.mjs` | The registry: `KIND_ORDER`, `PHASE_TWO_KINDS`, the module list. |
| `src/adapters/*.mjs` | File type to parts and back. `js.mjs` also gives a read-only `template` part to each inline Angular template (see Traps). `template.mjs` gives an `.html` or `.htm` file one read-only `template` part. `vue.mjs` splits a `.vue` file (see Traps). |
| `src/transforms/detect.mjs` | The `detect` kind: report-only matchers (vocabulary in Traps). `validateDetectRule()` checks a rule. |
| `versions/18.1.0/custom/sanitizer-source.mjs` | Two `custom` rules for the `sanitizer` option, picked by the rule's `mode` (see Traps). |
| `src/transforms/css-variables.mjs`, `theme-tokens.mjs` | `cssVariable` (css, js strings, template report) and `themeToken` kinds. |
| `src/lib/string-literal.mjs` | `replaceStringLiteral()`: edit a string literal and keep its quote style. |
| `src/lib/literals.mjs` | The literal guard of `printJsPart()`: `intendedLiterals()` (what the final tree holds, JSX texts included), `keepJsxEntities()` (the raw spelling of an unedited JSX text, before printing), `guardLiterals()` (compare with the printed text, repair or throw), `linesInsideLiterals()` (for `restoreTabs()`), and `templateRaw()` / `stringRaw()`, which a transform uses to read the text of a literal it edits (see Traps). |
| `src/lib/tool-comments.mjs` | `blankToolComments()` (the `TODO(handsontable-codemod ...)` comments of the tool, as spaces, line breaks kept) and `blankCodeComments()` (every comment of a js part, read with the parser on the original text, so the offsets are real in a tab-indented file). |
| `src/lib/todo.mjs` | The writer of TODO comments in the AST, and the only source of their text (`formatTodo()`; `carrier.mjs` places the same text after printing): `shortenAdvice()`, `formatTodo()`, `addJsTodo()` (a `//` comment, or a JSX comment for a `JSXElement` path), `addCssTodo()`, and `collectComments()` for the dedupe. |
| `src/lib/text-file.mjs` | `readUtf8()`, `decodeUtf8()`, and `stripBom()`: every file the tool reads as text goes through the strict decoder, which throws `NotUtf8Error` (the runner turns it into a `skipped-file` warning) and keeps a leading byte order mark as `U+FEFF`. |
| `src/lib/redact.mjs` | `redact()`: `//user:TOKEN@` becomes `//***@`, and the value of a query or fragment parameter named like a secret (`?token=`, `&access_token=`, `#key=`) becomes `***`. Applied where a dependency spec is named in a message, and again to everything `cli.mjs` writes and to both renderers, so a new message cannot leak. |
| `src/lib/inline-script.mjs` | `scanScripts()` (the `<script>` elements of an HTML text, found with indexes and a memo, not a backtracking expression; an optional `stats` object counts its steps for `scan-complexity.test.mjs`) and `createLineCounter()` (lines for offsets that grow, one read of the text). Used by `adapters/template.mjs` and the `missingOption` check of `detect.mjs`. |
| `src/lib/anchor.mjs` | Where a comment about a property can go: `enclosingAnchor()`, `hasOwnLines()`, `anchorForProperty()`. |
| `src/lib/option-sites.mjs` | `templateOptionSites()` (wrapper tag attributes in template text) and `dynamicOptionSites()` (assignments and `setCellMeta()`), shared by `options.mjs` and the `detect` `property` matcher. |
| `src/adapters/unsupported-style.mjs`, `unsupported-markup.mjs` | `.less`, `.styl`, `.stylus`, `.sass`, `.pcss`, `.postcss`, and `.svelte`, `.astro`, `.mdx`: never parsed, only reported through `skipReason` when the text names Handsontable or a theme variable. |
| `src/lib/safety.mjs` | The meaning of `safe`: `rewrites(rule)`, `modeOf(rule)`, `requiresSafe(kind)`, `reportInstead()`. |
| `src/lib/json-edit.mjs` | `JsonDocument`: edits a `package.json` by offset (`setString()`, `addMember()`), `scanJson()`, `memberPosition()`. Every edit is verified against the parsed model. |
| `src/lib/css-edit.mjs` | `CssDocument`: edits a stylesheet by offset (`replaceInDeclaration()`, `replaceInAtRule()`, `insertCommentBefore()`) and prints the original text with the edits spliced in. `print()` parses the result again and compares it with the postcss model. |
| `src/lib/validate.mjs` | `problemsOf()` and `assertRenameOrRemoval()`, the helpers behind the `validate(rule)` hook of a transform. |
| `src/lib/rename-key.mjs` | `renameKey()` and `removalAdvice()`, shared by the option, theme token, and CSS transforms. |
| `src/lib/resolve.mjs` | `createHop()`: the one-hop resolver of a file. `hop()` follows an identifier or a member read (`PRESET.chf`) to the value a `const` of the same file holds, through `as const`; `stringOf()` reads the string behind it; `spreadsOf()` resolves the spreads of an object, and `{ exact: true }` answers `null` for an object the file changes. `createHop(j, root, { stable: true })` is for a caller that never edits the tree (`detect`): the identifiers are then indexed by name once (`identifierIndex()` in `scope.mjs`), so asking about many bindings costs one walk. Leave it off in a transform that edits, because the index holds the paths as they were. Nothing else is followed (see Traps). |
| `src/lib/hot-bindings.mjs` | What a file binds to Handsontable: `collectHotBindings()` (`isInstance()`, `isPluginReceiver()`, `isPlugin()`, `valuesOf()`, ...), `isUnresolvedReceiver()`, and `receiverOfGrid()` (`instance`, `other`, or `unknown`, for a call that only the grid answers to). Every question about a name is answered from its whole history (see Traps). |
| `src/lib/holders.mjs` | `createHolders()`: `heldBy(objectPath)`, the other uses of the variable, member, or export that holds an options object, and the objects that spread it (see Traps). |
| `src/lib/custom-reader.mjs` | `createReaderFinder()`: the one check "could custom code read this option of this object or element" behind `readerAdvice` (see Traps). |
| `src/lib/facts.mjs` | `addFact(ctx, name, line)`, `hasFactFor(ctx, name)`, and `factSite(ctx, name)`: facts keyed by name and directory, with the file and line of the first sighting (see Traps). |
| `src/lib/marker.mjs` | Where a generic TODO marker goes: `createMarkerIndex()` (a report line to its anchor and the nodes above it, `anchorsAbove()`), `markerTargets()` (the climb from a node to a property, array element, statement, or JSX element), and `cssTargetAt()`. |
| `src/lib/carrier.mjs` | `MarkerCarriers` and `spliceCarriers()`: the edits that recast would lay out again are made as text after printing. A marker on an untouched one-line array element, a marker on an untouched one-line statement, and the removal of an expression statement (see "TODO comments"). |
| `src/lib/dependency-range.mjs` | `planRange(spec, target)`: rewrite, keep, skip, or report a `package.json` range. `isSourceSpec()` (a path, URL, git, `workspace:`, `catalog:` spec: no version in it), `parseCatalogSpec()`, and `aliasRange()` are shared with `versions.mjs`. |
| `src/lib/pnpm-catalog.mjs` | `parseCatalogs()` (a line scan of the `catalog:` and `catalogs:` blocks of a `pnpm-workspace.yaml`, no YAML dependency) and `findCatalog()` (the nearest workspace file between a `package.json` and the project directory). |
| `src/transforms/import-source.mjs`, `export-rename.mjs`, `namespace-type.mjs`, `export-removed.mjs` | `importSource`, `exportRename`, `namespaceType`, and `exportRemoved` (rule shapes in Traps). |
| `src/lib/type-rules.mjs` | Shared by those four: `*` module and path patterns, option keys and advice placeholders, `chooseSource()` (which candidate module a name is imported from), `reportOpaqueReferences()`. |
| `src/transforms/methods.mjs`, `call-unwrap.mjs` | `methodRemove` and `methodMove` (receiver rule, see Traps), and `callUnwrap`. |
| `src/transforms/options.mjs` | `optionRename`, `optionMove`, `optionRemove` on option objects, wrapper attributes, and `context.callArg` arguments (see Traps). |
| `src/transforms/dependencies.mjs` | The `dependency` kind: range bumps, `add`, `reportMissing`, `reportPresent`, `replaced`, and `facts` (item fields in "Rule fields by kind"). `matchesWhen(j, root, when)` is the fact matcher. |
| `src/report.mjs` | `Report` (dedupe, `scope: 'run'` entries kept once with their `files`, ordering by version then rule id, `notes` for the top of the report), `renderConsole()`, `renderMarkdown()` (title with the versions and the date), `summaryLine()` (both renderers print it), `clusterByMessage()` (a message that several locations share is printed once, then the locations), `SKIPPED_RULE_ID`, `BELOW_FROM_RULE_ID`, and `counts().marked`. |
| `src/discover.mjs`, `git.mjs`, `diff.mjs` | Support modules. `git.mjs` resolves git once per `PATH` through `gitExecutable()`, lists the dirty paths with `--untracked-files=all`, and answers `isIgnored()`. |
| `src/lib/find-executable.mjs` | `findExecutable(name, { env, platform, isFile })`: the first match in the absolute entries of `PATH` (an empty or relative entry and the current directory are never searched; on Windows only `.exe` and `.com`, `Path` in any case). |
| `src/lib/safe-write.mjs` | `writeFileSafely(path, expected, output)`: temporary file, a last read of the target against `expected`, `rename`, the mode kept. `StaleFileError`. |
| `src/lib/markdown.mjs` | `codeSpan()` (a fence that fits the text), `markdownText(text, quoted)` (the message of an entry as Markdown that renders as text), and `plainText()` / `plainName()` (control characters and bidirectional overrides as `\x1b`). |
| `src/lib/line-endings.mjs` | `restoreLineEndings(source, printed, working)`, `dominantBreak()`, `splitLines()`: the line endings of a printed js part (see Traps). |
| `src/lib/leading-trivia.mjs` | `splitBom()`, `maskShebang()` and `unmaskShebang()`, and `assertLeadingTrivia()`: what stands before the first statement of a printed js part (see Traps). |
| `src/lib/unreached-package.mjs` | `unreachedPackageNotes()`: the note for the `package.json` above a folder of the run, which phase 2 never reads. |
| `versions/<semver>/` | `manifest.json`, optional `custom/*.mjs`, optional extra rule files, `__fixtures__/`. |
| `test/*.test.mjs`, `test/helpers/` | Tests (`node:test`). Helpers are not listed in the test script. |

## Run model

1. `resolvePlan()` loads every manifest, resolves `--from` and `--to`, and selects manifests with
   `from < version <= to`. A partial `--from` stands for the end of its line (`17` means "any 17.x"), a partial
   `--to` for the highest known manifest of that line (`18` means the latest 18.x). `--from` falls back to
   `node_modules/handsontable/package.json` (searched up to the project directory only, never above it), then the
   `package.json` range minimum. When both name a version and the range does not admit the installed one, it is a usage
   error that asks for `--from`. `--to` defaults to the latest
   `released` manifest, or to the latest manifest of any status with `--include-draft` (`defaultTo()`). `draft` manifests
   need `--include-draft`.
   `--only` takes a full rule id or a prefix that ends in `*`. A pattern that selects no rule in range is a usage error,
   and when it selects a rule of a draft manifest that the run leaves out, the error names the draft and `--include-draft`.
   A range with no manifest (`--from` not below `--to`) is a usage error that lists the known migrations. The
   auto-detect (`detectProjectVersion()`) runs once per path argument, from the path up to `cwd`, and paths that
   resolve to different versions are a usage error that asks for `--from`.
   The `from` of every manifest says which line it migrates from, and the lowest one is the oldest covered version
   (`oldestCovered()`). A `--from` below it is a usage error that names the earlier guides from `EARLIER_GUIDES` in
   `versions.mjs` (`uncoveredSteps()`), unless `--allow-uncovered` turns the same text into a note at the top of the
   report. A `--to` on a later minor line than the newest migration in range (`isNewerLine()`) runs up to that
   migration and says so, in the notes and at the top of the report. When the line `--to` names holds a draft that was
   left out, the note says that the draft was skipped and where the run stops, not that no migration is known. An empty range explains itself through
   `nothingToMigrate()`: a version that came from `package.json` or `node_modules` gets "already names", and a
   partial `--from` gets the `--from <minor>` hint taken from the `from` of a manifest. A `handsontable` range that
   names no version (`latest`) is a usage error that asks for `--from`. With no `--from` and no range at the path or above
   it (a monorepo root), `scanPackageVersions()` reads the `package.json` files below the path arguments: different
   versions are a usage error that lists the packages, equal ones become the `--from` and the note names the files.
   `minimumOfRange()` takes the lowest bound over every `||` alternative (`^18 || ^17` is 17, the highest bound inside
   one: `>=17 >=17.2` is 17.2) and returns `null` when an alternative has no lower bound (`<18`, `*`, `x`), uses `>`, or
   holds a token that is no comparator (`latest`), via `rangeFloor()` in `lib/dependency-range.mjs`.
   A spec that points at a source is not a version: `minimumOfRange()` returns `null` for `file:`, `link:`, `portal:`,
   `workspace:`, `catalog:`, git, `github:`, URL, path, and `owner/repo` specs (`isSourceSpec()`), so detection says
   "... is not a version. Pass --from." and `scanPackageVersions()` skips them, and names the first one when no
   package names a version. An `npm:` alias reads the range after its last `@`.
   `plan.fromText` carries the resolved `--from` to the transforms as `ctx.fromText`.
   A `dependency` range below `--from` (`lineBelowFrom()`: an earlier line that does not admit the `--from` version)
   is never bumped. `dependencies.mjs` reports one `below-from` warning per `package.json` (`reportBelowFrom()`), the CLI
   repeats it on stderr after the report, and the exit code stays 0. A CDN URL below `--from` gets a sentence in its own
   entry. A `peerDependencies` range below the target is never rewritten: it gets a `manual` entry that says how to widen it
   (`reportPeerBelow()`), and none when it already admits the target.
2. The git guard refuses a dirty tree (exit 2) unless `--allow-dirty`. `status` lists untracked files one by one,
   whatever `status.showUntrackedFiles` says. It does not apply to `--dry-run`,
   `--list`, `write: false`, or a directory outside a git repository, where `onWarning` gets a one-line notice before
   the first write. An untracked file at the `--report` path (`reportPath`) is not a change. After the status check,
   `hiddenPaths()` (`git ls-files -v`: a lowercase tag or `S`) refuses a tracked file under the directory that is flagged
   `assume-unchanged` or `skip-worktree` and exists on disk, because `git status` never lists an edit to it (a flagged
   path that is not on disk, as a sparse checkout leaves, is no risk); `--allow-dirty` overrides it. `isGitRepo()` answers `false`
   for git's "not a git repository", for a git that cannot start, and for no git program, each only when no `.git` entry
   (a directory, or the file of a linked work tree or a submodule) stands at or above the directory (`directoryWithGitEntry()`:
   git also says "not a git repository" for a corrupt `.git/HEAD` or a `GIT_COMMON_DIR` that does not exist). It throws
   `GitNotFoundError` (a `GitError`) for no git program with such an entry, and `GitError` for a git that cannot start
   or says "not a git repository" with such an entry, and for any other failure of `rev-parse` (git's own message): `run()` then
   refuses a write unless `--allow-dirty` (exit 2, the message says that git was not found, or what git said), and
   otherwise reads the files without git and adds a note. Git runs with `LC_ALL=C`, because that one message is matched
   as text.
3. `discover()` lists files (`git ls-files -z --cached --others --exclude-standard`, or an fs walk). "Ignored" is what
   git says, so the global ignore file counts and the file list agrees with `git status`. A project directory that an
   outer repository ignores gets an empty list, and `git check-ignore` confirms it, so the directory is walked and a note
   says so (`git diff` will not show the changes). A git entry that no adapter handles and that is a directory is a
   submodule or an embedded repository: it goes to `skipped` with `kind: 'repository'`. Outside git the walk also skips
   every dot-directory and `BUILD_OUTPUT_DIRECTORIES`, and reports a skipped directory that holds a readable file
   (`kind: 'directory'`, found by `holdsCandidate()`). A directory the walk cannot read (below the start: `EACCES`, a race
   with a removal) goes to `skipped` with `kind: 'unreadable'` and the error code as `reason`, and the walk goes on; the
   directory the walk starts from rethrows, and `discover()` turns that into a `UsageError` (exit 2) that names the path and
   the reason (`readFailure()`). A path argument is read in the letter case the file system stores
   (`realpathNative()`), with a note. `discover()` fills `notes` and `reasons`: when no file is found at all, `run()`
   adds "No files to migrate." and the reasons to `result.notes` and `report.notes` (exit code 0, justified in the
   README). It drops
   `node_modules`, `dist`, `build`, `coverage`, `.git`, `*.min.*`, `*.d.ts`, files deleted on disk, and any
   extension no adapter handles. JSON is limited to `package.json`. A file named on the command line bypasses the
   generated-output filter (`dist`, `*.min.*`, `*.d.ts`), but not the two rules of the directory form: a file below
   `node_modules`, and a file that git ignores in a repository (`isIgnored()`), is never read, and the reason goes to
   `reasons` as for a directory. It never follows a symbolic link: a link to a file or a directory, a path argument that
   is one or sits below one, goes to its `skipped` list and the report shows it under "Skipped files". Git lists a
   link to a directory as one entry without a handled extension, so `directoryLinks()` checks the entries of the git
   list that no adapter handles with `lstat`, and the fs walk checks every entry. A path
   check uses `leavesDirectory()`, so a directory named `..odd` is inside the project. Before a write, `run()` asks
   `resolvesInside()`: the real path of the file must be inside the real project directory. `--report` is refused
   (exit 2) when its target is a symbolic link or sits below one (`linkOnReportPath()`: a link at or below the project
   directory, the target itself, or a link outside the project that makes the directory of a path spelled outside land
   inside it; a link on the part outside the project, `/tmp` on macOS, is the system's business and never refused; the
   message names the link as typed, absolute for an absolute path), a file git tracks, a file the run migrates, an existing file of a
   type the tool handles, a path with a `.git` component, a directory, an existing file that cannot be written, an
   existing file that is not empty and whose first line is not the report title (`REPORT_TITLE` in `report.mjs`,
   `isPreviousReport()`: only the file of an earlier run is replaced, inside the project or outside it), or a file in a
   directory that does not exist or cannot be written (`assertReportTarget()`, before any file changes). The same file is decided by
   `isSameFile()`: the real path as the file system stores it (`realpathNative()`) or the same device and inode, so
   another letter case and a hard link do not get past `files.includes()` or `git ls-files`, which compare strings. Every git
   command goes through `git()` in `git.mjs`, which adds `--no-pager` and `-c core.fsmonitor=false`: a repository can
   set `core.fsmonitor` to a program that `ls-files` and `status` run. A clean filter still runs in `status`, and
   cannot be turned off without marking every Git LFS file as modified, so the README says to run the tool only in a
   repository you trust. The skipped entry of a link says where it points when the target is inside the project
   (`linkMessage()`), and whether the run migrates it.
4. Phase 1 visits every file through `transformFile()`: adapter by extension, skip when no selected rule has a
   registered transform for the adapter's kinds, skip when the adapter's cheap `precheck` regex does not match,
   parse once, run versions ascending and kinds in `KIND_ORDER`, print only parts that called `markChanged()`.
   Parse and transform failures become `parse-error` and `transform-error` warning entries, the file is left
   byte for byte alone, and the run ends with exit code 1. A file above `MAX_FILE_BYTES` (1 MB, `--max-file-size`) is
   not read and becomes a `skipped-file` warning, as does a file with a line of more than `MAX_LINE_LENGTH` (20,000)
   characters (`hasVeryLongLine()`, phase 1, a `package.json` exempt), because the size cap does not bound the cost of
   a one-line bundle, and as does a file that is not valid UTF-8 (`readUtf8()` in
   `lib/text-file.mjs`, phase 1 only). A write goes through `writeFileSafely()`: a temporary file in the directory, a last read of the target that must still
   be the text the tool started from (else a `write-error` that says the file changed while the tool ran), `rename`,
   the mode kept. A write that fails or is refused is a `write-error` warning, the file is not counted as changed, its
   `changed` entries are dropped from the report (`withoutApplied()`, which also clears `marked`), and the run ends
   with exit code 1. `transformFile()` also turns what an adapter cannot read into
   `skipped-file` warnings: `skipReason` (whole file), `handle.skippedBlocks` entries with `relevant: true` (Vue), and
   `skipNotes(source)` (inline scripts of an HTML page). The report lists them under "Skipped files".
5. Phase 2 visits only `package.json` files and runs the kinds in `PHASE_TWO_KINDS` (`dependency`) after phase 1
   has filled `ctx.facts`. Before phase 1 the runner records the directory of every discovered `package.json`
   (`registerPackageDir`), so a fact is credited to the nearest `package.json` above the file it came from.
   A phase 2 module that needs facts declares `scan: { fileKinds, precheck? }` on the transform: phase 1 then also
   calls its `apply`, with its rules, on parts of those kinds, using `scan.precheck` instead of the adapter's.
   That call collects facts and never edits. The `dependency` module is the only user.

6. Ctrl-C. `bin/handsontable-codemod.mjs` aborts an `AbortController` on the first SIGINT (`process.once`, so a second one
   ends the process) and gives its signal to `main()`, which gives it to `run()`. `run()` reads `signal.aborted` only
   between files, in both phases, so the file in progress is written whole (one `rename`) or left alone, and a run that
   was interrupted skips phase 2. It returns `interrupted: true` and `inGit`, `main()` prints `interruptedLine()` on
   standard error and nothing else (no report, no next steps, no `--report` file) and returns 130. The undo advice is
   `git checkout -- .` only for a clean start in git: after `--allow-dirty` it would discard the user's edits and
   outside git there is nothing to restore from. The same bin sets an `error` listener on `process.stdout` and
   `process.stderr` that ignores `EPIPE` (a reader such as `head -1` that closed early) and rethrows anything else, so
   a closed pipe never turns the exit code of a finished run into 1. `main()` stays free of both: it never calls
   `process.exit` and tests inject the writers.

A transform may export `rescue(rules, source)`: the rules that may still run on a file the adapter's `precheck` rejected.
The runner calls it only for such a file and then runs the module with the returned rules alone, so every other rule
keeps the guard. `detect` is the only user (see the `precheck` field).

`transformFile({ filePath, source, plan, options, facts, registry, phase })` reads and writes nothing. The run
loop and the fixture tests both call it, so a fixture needs no temp directory, no git, and no discovery. Its `hooks`
argument has one injection point, `afterCommit(part)`, which runs for each `js` part after its carriers committed and
before it is printed: a test uses it to break a sentinel and to see the file stay as it was. It exists for nothing else,
like the `hooks` of `run()`.

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
| `parser` | `ts`, `tsx`, or `babylon` for a `js` part, `null` for any other kind. |
| `j` | jscodeshift API bound to the right parser. `null` unless `fileKind` is `js`. |
| `root` | Parsed form, edited in place. `js`: a jscodeshift Collection. `css`: a postcss Root. `json`: the parsed value. |
| `report(entry)` | Add `{ ruleId, severity: 'changed' or 'manual' or 'warning', line?, message, lines?, scope?, mergeKey? }`. The runner fills `file`, `guideUrl`, and adds the part's `lineOffset` to `line` and `lines`. Identical entries collapse. `lines` lists every match of a collapsed group, and the renderers print them. `scope: 'run'` marks a note that is the same in every file (a rule's `note`): the `Report` keeps it once with the list of files, under "Read once". A later entry with the same `mergeKey` in the same part replaces the earlier one, so two migration steps that touch one spot report the net result once. `merge: 'earliest'` keeps the first entry instead: two merge policies exist. `latest` (the default, used by `dependency` bumps) reports the net change with the latest target. `earliest` (used by `detect` rules that share a `mergeKey`) lets the rule of the earliest migration own the id, the message, and the guide link. `todo: false` keeps one `manual` entry out of the code. `markLine` is the line the generic marker is placed from when `line` names a spot inside a literal that cannot hold a comment (a line of a multi-line template literal, a key of a Sass map): the report keeps `line`. |
| `todo(target, ruleId, text, comment?)` | Leave `TODO(handsontable-codemod <ruleId>): <first sentence of text> See <guide link>` before a js node or path or a postcss node, once, and add a `manual` entry with the whole `text`. `comment` replaces `text` as the source of the comment when the caller has a better short form. The link is added only for a rule with a `guide` anchor. Returns whether a comment was inserted. It calls `markChanged()` itself. `json` gets the entry only. A NodePath of a `JSXElement` or `JSXOpeningElement` gets a JSX comment `{/* ... */}` before the element (or before the expression that holds it) when the element is a child of another element, else a `//` comment on the enclosing statement when it starts at most 3 lines above, else on the element's first attribute. |
| `comment(target, ruleId, text)` | The comment half of `todo()`: the same TODO comment, no report entry. A removal uses it, so its one `changed` entry carries the advice. |
| `removeStatement(path)` | Remove the expression statement, or the import declaration that `removeNamedImport()` emptied (its `cut` option), at a NodePath of a statement list, and return `true`. The statement is cut out of the printed text, so the statements around it keep their layout (see "TODO comments"). It returns `false` and does nothing for a statement that is not an expression statement of the parsed text, that a rule gave a comment, or that is not an item of a list: the caller then removes it from the tree and moves its comments. `false` for a part that is not `js`. |
| `json` | For a `json` part, the `JsonDocument` that edits the text by offset: `setString(section, name, value)` and `addMember(section, name, value)` return `false` and change nothing when the scan of the text and the parsed file disagree, and the transform then reports `manual`. `null` for every other kind. A transform never prints a `package.json` with `JSON.stringify`. |
| `css` | For a `css` part (a stylesheet or a Vue `<style>` block), the `CssDocument` that edits the text by offset and keeps `root` in step. A transform reads the postcss `root` and edits only through `replaceInDeclaration(declaration, pattern, replacement)`, `replaceInAtRule()`, and `todo()`/`comment()`. Each replace returns `null` (no match), `true`, or `false` (the text at the node's offsets is not what the model says, or the value holds a comment): on `false` the transform reports `manual` and edits nothing. A transform never assigns `decl.prop`, `decl.value`, or `params` itself and never stringifies `root`. `null` for every other kind. |
| `cssScope`, `lineOffset`, `fromText` | `'scoped'`, `'module'`, or `null` for the Vue `<style>` block of a `css` part; the part's zero-based line offset (add it by hand when a line is stored outside `report()`); the run's `--from` as text. |
| `catalog` | For a `package.json` in phase 2 that holds a `catalog:` spec: `{ file, catalogs }` of the nearest `pnpm-workspace.yaml` (`catalogs` maps a catalog name, `''` for the default, to package ranges), else `null`. The runner reads it, so a transform stays free of file reads. |
| `ancestors` | For a `package.json` in phase 2: the `package.json` files of the project above it, nearest first, parsed (`[{ file, manifest }]`, `manifest` is `null` for a file that cannot be read as JSON). A fixture has none. |
| `facts` | A `Set` shared across the run. Add `uses-formulas` style keys in phase 1, read them in phase 2. |
| `options` | `{ aggressive, dryRun, todo }`. `todo: false` (`--no-todo`) makes `todo()` and `comment()` write nothing and switches the generic markers off. `markers: false` (tests use it) switches off only the generic markers. Never write to disk from a transform. |
| `derived(key, compute)` | What a transform reads from the tree, kept for the next transform and the next version until `markChanged()` ran: it returns `compute()` for a key, and calls it again only after an edit. `compute()` must be a pure function of the tree, and the caller must not change the value (see Traps). |
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
the common fields (`id`, `kind`, optional `guide`, `safe`, `minConfidence`, `message`, `advice`, `twins`). `safe` is
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
| `optionMove` | `from*` (`<option>.<key>`), `to*` (a sibling), `report`, `reportWithout`, `readerAdvice`, `levels`, `levelAdvice` |
| `optionRemove` | `name*`, `todo`, `advice` |
| `methodRemove` | `methods*`, `receiver*` (`"any"`, `"instance"`, or `{ plugin: key or keys }`), `advice` |
| `methodMove` | `methods*` (old to new name), `via*` (`{ method, args }`), `receiver*` (`"instance"` or `{ plugin }`), `properties` |
| `callUnwrap` | `callee*` (dotted path), `arg` |
| `cssVariable`, `themeToken` | `from*`, then `to` or `removed` + `advice`; `themeToken` also `callees` |
| `dependency` | `bump`, `replaced`, `add`, `reportMissing`, `reportPresent`, `facts` (item fields below) |
| `detect` | `match*`, `files`, `message`, `severity`, `requires`, `precheck` (regex source, tested without case, only with `requires: "none"`: a file the adapter's precheck rejects still runs this rule when it matches), `emitsFact`, `unlessFileMatches` (regex on the part text: the rule skips a part that matches), `mergeKey` (rules of other versions with the same key report a spot once, the earliest one wins), `todo` (`false` leaves no marker for the rule) |
| `custom` | `module*`, plus whatever the module reads (`mode`) |

`dependency` item fields: `bump` maps a package name to a target version. `replaced` maps a package name to the
manual text that names its replacement. `add` items take `name*`, `range*`, `onlyIfDependsOn*` (a package
name or a non-empty list; the item applies when the `package.json` declares one of them, and the section it adds to
is the one that holds the first of them), `whenFact`. `reportMissing` items (the package
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
4. Add fixtures (below), one per rule at least, with a negative case next to each positive one. `test/fixtures.test.mjs`
   fails until the `report.json` of some fixture names every rule of every manifest, released or draft. One fixture may
   name several rules (the type rules are grouped that way), but each rule id must appear in its report.
5. For a released migration, add a row to the "Supported migrations" table of `README.md` and update the kind table. The first column is
   `<from line> to <major.minor>`, for example `18.0 to 18.1`. `test/readme.test.mjs` requires one row per released
   manifest and compares the counts with `--list`.
6. Decide `status`. A `draft` manifest runs only with `--include-draft`, and `--to` defaults to the latest
   `released` one, so a migration under work stays `draft` until its guide is final. A draft has no row in the
   README table (`readme.test.mjs` counts the released ones only) and gets a "Draft migrations" note instead.
   **Flipping a draft to `released` makes the anchors binding**: every `guide` anchor of a rule must then be a heading
   of the guide, or the manifest test fails. The flip also needs three more changes: the "Supported migrations"
   row of the README, and the kind table counts; a fresh `exports-diff.generated.json` made from the released
   tarballs (the draft's diff compares the last release with `19.0.0-rc1`, so the flip needs a diff made from
   `19.0.0`, and a release candidate that changed the typings since needs its removed names covered first); and the removal of the draft-only test of that manifest
   (`is what the 19.0.0 manifest is until its guide is final` in `draft-manifest.test.mjs`).
   `notAutomated` (optional, top level) lists the guide sections that no rule covers, as `{ guide, reason }`, or
   `{ title, reason }` for a change the guide has no section for (a row of the deprecation table). It changes
   nothing in a run. `--list` prints how many there are, on the line before the counts, so the last line is always the
   counts. Write one sentence of reason per entry, and drop an entry when a rule starts to cover its section.
7. Run the package tests, the lint, and the smoke test. `manifest.test.mjs` checks that every manifest loads, ids
   are unique and prefixed, `from` is valid, and the guide source file and anchors exist.

### The 19.0 draft

`versions/19.0.0/` is a draft (`status: "draft"`, `from: "18.1"`). Its guide is not final, so its `guide` anchors are not
binding yet (see step 6), and its exports diff compares 18.1.2 with `19.0.0-rc1` (the first release candidate, the `rc` tag
on npm; the three wrappers are packed from the same two releases). The 19.0 scope is frozen, so a new section of the
guide is a fix and not new scope. The status stays `draft` until 19.0 is released as stable. The rules:

- **Rewrites (`safe: true`):** the four package ranges, `columnHeaders` to `colHeaders` in the export calls, the four
  resize-state methods (removed in 19.0), the two `Formulas` shortcut methods (no-ops), and the two type aliases
  `Settings` of `handsontable/plugins/exportFile` and `DataProviderOptions` of `handsontable/plugins/dataProvider`.
- **Reports:** one `detect` rule per change that has a pattern in user code (a hook set to `null`, the frozen column
  drag and the unfreeze hooks, an `updateSettings()` call on a grid (`receiver: "grid"`) in a file with a `dataProvider` or a `dataSchema` among them; the matcher does not read the arguments, so every
  `updateSettings()` call of a grid in such a file is reported), and
  `19.0.0/helper-sanitize`. The latter
  is a `callUnwrap` with `safe: false` on purpose. The guide says to remove the call, and from 18.1 that is right,
  because the helper returned its input unchanged. In a chained run from 17.x the 18.0 rule has already left the
  call, because 17.x sanitized, and a rewriting 19.0 rule would delete it.
- **`notAutomated`:** the sections with no pattern (a behavior change, a compiler error, a default). A reason says what
  is true of the tool: `the-minimum-browser-versions-are-higher` says the tool reads no `browserslist` key, no
  `.browserslistrc`, and no bundler target. Drop an entry when a rule starts to cover its section.

Traps of this draft:

- The `dependency` rule writes `^19.0.0` while only `19.0.0-rc1` exists, and that range matches no published version
  (`npm view 'handsontable@^19.0.0' version` finds none, because a range without a prerelease tag skips every
  prerelease). It stays: the wrappers of the candidate declare `handsontable: ^19.0.0` as their own peer range, so the
  range is what the release carries, and a prerelease range would be wrong the day 19.0.0 ships. A run on a project that
  must install the candidate says `npm install handsontable@rc`, as the README does.
- A rule that exists in two migrations (`resize-state-methods`, `export-column-headers`, `helper-sanitize`) is repeated
  with its own id, because a run from 18.1 never loads the 18.0 manifest. A chained run from 17.x therefore leaves one
  TODO per version on a call that stays (the first sentence names the version of the rule).
- A `detect` matcher that reads raw text never sees the comments the tool wrote: `regex`, `selector` in a template, and
  `unlessFileMatches` (of the rule and of `missingOption`) read the part through `blankToolComments()`. The marker
  repeats the guide link and the first sentence of its rule, and the anchor of a guide section can name what the rule looks
  for (the license key section does), so before this guard the second run reported every marker as a new match. The
  idempotency sweep in `test/idempotency.test.mjs` is what catches a new rule of this kind. `regex` reads the comments of
  the project too, unless the matcher says `code: true` (js only: every comment is blanked, using the parser on the
  original text). A matcher for a value says `in: "strings"`: in js it tests each string literal and template text, in a
  template or a stylesheet each quoted value (overlapping candidates, on one line for `'` and `"`), so a docs URL or a
  sentence that holds the text is not the value. Anchor the pattern (`^\\s*key\\s*$`) for the whole value.
- `19.0.0/non-commercial-license-key` has `requires: "none"` and a `precheck` of the two key texts, so a file that never
  says Handsontable (a shared `license.ts`) is read. `rescue()` keeps only that rule alive for such a file, so nothing
  else runs there. The Angular constant `NON_COMMERCIAL_LICENSE` is still found as a word in the raw text. A Vue block or a
  page that never says Handsontable is not rescued by the adapters that parse blocks (their script precheck is their own).
- `19.0.0/custom-borders-menu-color` reports a `getBorders()` call on a `customBorders` plugin receiver
  (`receiver: { plugin: "customBorders" }`) and nothing else. The guide section is about the color a menu border stores,
  and a comparison with `'#000'` has no precise pattern (the string is a common color). So the rule asks the reader of
  the borders to check whether the code reads `color` as a hex string.
- `19.0.0/auto-row-size-use-headers` has `inGuide: false`: the develop guide has no section for the removed default key
  `useHeaders` of the `AutoRowSize` plugin yet. It reports `getSetting('useHeaders')` on an `autoRowSize` plugin receiver
  (`argMatches: "^useHeaders$"`), and never the same read on `autoColumnSize`, which keeps the key. When the guide gets
  a section, replace `inGuide` with the `guide` anchor.
- `19.0.0/loading-without-dialog` uses the `pluginRegistration` matcher: the `registerPlugin()` calls (any callee named
  `registerPlugin`, or a local name of that import) whose argument is `Loading` imported from `handsontable/plugins` or
  `handsontable/plugins/loading` under any local name, or a member of a namespace import of either, and no such call
  for `Dialog` in the part (`withoutPlugin`). A `require()` of the plugin is not followed.
- `19.0.0/checked-menu-item-property` uses `property` with `in: "menu-item"` (js only): the object is an element of the
  `contextMenu` or `dropdownMenu` array, a value or element of `items` of that option (also in JSX), the same inside the
  `submenu` of an item, or it has the shape of an item (`name` and one of `callback`, `submenu`, `hidden`, `disabled`,
  `renderer`, `isCommand`). Assignments are not read. The rule keeps its file gate (a `contextMenu` or `dropdownMenu` key).
- `valueIs` and `import` read js only, except that `valueIs` of `true`, `false`, or `null` also reads the wrapper
  attributes of a template, when the attribute is bound (`:strict`, `v-bind:`, `[strict]`, `bind-`) and its text is that
  word. A rule that uses a js-only form lists `files: ["js"]`, never `template`. `property` with `valueMatches` and
  `regex` also read templates. `19.0.0/dropdown-strict-false` gates on a quoted `dropdown` anywhere in the part, as it did
  in js, so a template with a dropdown column reports the bound `strict=false` of any column in it.
- Every fixture of this draft has `options.json` with `only`, so a rule that matches a common input (the license
  regex, `rowHeights`) cannot change the exact `report.json` of another rule's fixture.
- `19.0.0/helper-sanitize` has no `namespaceType` rule for `Handsontable.helper.sanitize`. `type-rules.test.mjs`
  counts a `callUnwrap` rule whose `callee` equals the removed member as its cover.

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
  `correctFormat` (no built-in code reads it in 18.0.0, 18.1 warns) and `datePickerConfig` (`DateEditor#prepare` warns
  and ignores it) qualify, but only for the built-in cell types: a custom editor, renderer, or validator can still read
  them. So both rules carry `readerAdvice`, which asks for the custom reader check (see Traps) and keeps the option
  when it cannot rule a reader out. Its comment says `Deleted <name> here.` only on a deletion.

## TODO comments

Two writers leave a marker. A transform that knows the exact node calls `ctx.todo()` or `ctx.comment()`. Every other
`manual` entry of a js or css part gets a generic marker at its `line` (and at each of `lines` for a collapsed
entry): `createContext()` collects them and `applyMarkers()` places them after all transforms ran, so a line still
names the node it was taken from. The anchor is the outermost node that starts on the line (a function body on the line
of its signature never takes it), then `markerTargets()` climbs to a property, array element, or statement on lines of
its own, a JSX element, or a declaration; a `BlockStatement` is never an anchor. A block that opens the line has no
statement above it to take the marker when it stands among the statements of a program or another block (`{ a();
hot.undo(); }`), so `createMarkerIndex()` falls back to the outermost node of that line that is not a block, the first
statement inside it, and the marker lands in front of that statement. A shape with no anchor at all stays report-only,
and `marked` and the summary count say so. A run is idempotent because
`hasJsTodo()` looks for the same comment on every place of that chain (an earlier run, or a rewrite of the element,
can have spread a one-line object over lines, which turns a property into one with its own line), and `addCssTodo()`
looks through the run of comments before the node. The same spreading moves the code after the object to a line of its
own, so the second run anchors a call on an inner statement while the first run commented the enclosing one (the
outermost node of the shared line, first in document order, so also an earlier statement of the same line). `anchorsAbove()`
in `marker.mjs` lists every statement, member, and array element up to the root, plus the earlier siblings of each that end
on the line it starts on, and `hasEarlierTodo()` in `todo.mjs` counts a comment of the original source in front of any of
them. `sitsBefore()` reads the text between the comment and the node from recast's `Lines` object (`node.loc.lines`), not
from `source.slice()` with parser offsets: the offsets count the text recast hands to the parser, with `os.EOL` line breaks
and leading tabs as spaces, so on Windows or in a tab-indented file they are not offsets of the part's text.
It reads the original source only, so a marker this run writes for one spot never stands in for another. The cost: a
call added later, deep inside a function whose enclosing statement already carries the same comment, gets none, and
stays in the report (`marked` is then true for it). `idempotency-nested.test.mjs` is the guard. The default is on for a `manual` entry in a js or css part. It is
off for a `scope: 'run'` note, an entry with `todo: false`, a rule with `todo: false` (`18.1.0/license-key-missing`, whose advice holds for every environment, and
`18.1.0/synthetic-header-mousedown`, which flags test code, and `18.1.0/column-move-hooks`, which matters only to code that
detects a header click), and any part that cannot hold comments (templates, HTML,
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
`transform-error` that leaves the file alone. When only white space and single-line block comments precede the sentinel on its line (`/* fx */ { ... },`), the
comment lines go above that line, at its indentation, so the element keeps the comments it had; anything else before
the sentinel keeps the older placement. The second run finds the marker because the parser attaches both comments to
the element. A property keeps its children's text when it is printed again, so its comment never moves anything and
takes no carrier.

**A statement takes its comment as text too, through the tree first.** A comment on the `if` statement of a kept call
that is the whole body of a statement without braces (`if (c) call();`, from `ctx.todo()` in `methods.mjs`) made recast
print `if (c)` and the call indented on the next line, a label lost the indent of its statement, and `for (;;)` came
out as `for (; ; )`. recast patches a node of another type that is an expression into the range of the old one, but a
statement of another type it cannot patch, so it prints the whole list of statements again. A swap of the statement
itself is therefore no carrier, and the TODO is not queued either: `ctx.todo()`, `ctx.comment()`, and `applyMarkers()`
write the comment into the tree as before (`addJsTodo()`), so every later rule sees it (`hasJsTodo()`, the twin check)
and a rule that removes a declaration moves it with the declaration's other comments. The comment objects of
`insertLineComment()` are remembered (`isToolComment()`). After the last rule, `MarkerCarriers.commit()` reads the
tree once (`scanTree()`), and for every statement that holds such a comment, wherever it ended up, it takes the comments
of the tool off and tries to carry them. A statement is carried when it is a `Statement` or `Declaration` of the parse
(it has an `original`), has the comments the parser found (once the tool's own are off) and none of them turned into
a trailing one, stands on one line, starts its line (white space, or a byte order mark, before it), and prints as its
original text (`statementText()`). Then the first expression of the statement in the text, the one with the smallest
start column (the outermost where two start together), outside any JSX element, on one line, with no parentheses of its
own, is swapped for an identifier named by a sentinel and the text of that expression (`swapSite()`,
`carryStatement()`). That swap is a patch of the range of the expression alone, so the statement prints as it was with
the sentinel in it, and the printed copy of the statement is compared with `prefix + sentinel + the rest of the text`
before the swap is kept. A statement that fails any step keeps the comments in the tree and prints as before. After
printing, `spliceCarriers()` finds the sentinel, checks that the text from `sentinel - prefix` has the statement
exactly, removes the sentinel, and puts the comment lines above the line, above a run of next-line directives, at the
indentation of the line. So a later rule that rewrites the statement wins on its own (the print check fails and the
comment stays in the tree), a second TODO of another rule lands in the same place, and a twin chain leaves one comment.
Shapes that stay with the printer: a statement that shares its line with other code (`{ call(); }`, `function f() {
call(); }`, `a(); call();`), a brace-less `if` with an `else`, or a label, that spans lines (a multi-line statement
whose layout the printer keeps otherwise: a block, a call with its arguments on lines, an object, a template literal), a
statement with no expression in it (`debugger;`), and a JSX statement. Reading the multi-line claim: a comment on a
multi-line statement keeps the layout, except where a clause stands on the line of its keyword inside it
(`if (a) b();` then `else c();`, `label:` then its loop).

**A removed expression statement is cut out of the text.** `ctx.removeStatement(path)` (`methods.mjs`,
`pruneKeepingComments()` is the fallback) swaps the statement in its list for another expression statement whose
expression is a sentinel identifier. recast patches a statement of the same type into the range of the old one (the
statement's own `;` included) and leaves the list the same length, so the statements around it are neither reprinted nor
joined. The comments of the statement go onto the stand-in as the same objects, so they print where they stood, and
`removeStatement()` refuses a statement whose comments a rule changed. After printing, `cutRemoved()` removes the
sentinel with its `;`: the whole line with its break when nothing else stands on it (the break before it when it is the
last line and has none), else the statement and one run of spaces, the one after it, or the one before it when nothing
follows. A file without semicolons would run the line before into a line that starts with `(`, `[`, a template, or an
operator, so a `;` stays in that case (`startsWithContinuation()`, `endsUnterminated()`; a run of removed statements is one
gap, the stand-ins are skipped to reach the statements that stay). A previous statement that ends in `}` counts as ended,
so `const o = {}` before a removed call and a line that starts with `(` is still joined, as it was on the old path: the
guard does not cover it. `commit()` drops a stand-in that
left the tree with its container. When another rule changed the length of the same list the printer lays the list out
again, and the stand-in prints on a line of its own (no `loc`), so the cut still holds and a shared line is split. The
removal of an import declaration (`removeNamedImport()` with `cut: ctx.removeStatement`) is cut as text too: the specifier
is edited first, its comments move to another declaration, and the declaration is swapped for `import "sentinel";`, an
`ImportDeclaration` with no specifier (same type as the old node, so recast patches it into the old range), which
`cutRemoved()` takes out with its keyword and quote. A byte order mark that stands alone on the line goes with it. The
comments of the declaration are not kept on the stand-in when they moved (`keepComments: false`). `spliceCarriers()` reads the printed text once as lines (`sentinelLines()`) and edits the line a
sentinel is on, and `intendedLiterals()` finds the record of a carrier identifier through `recordOf()`, a map: a file with
thousands of sentinels (a removal of every call of a generated file) costs a few times the print and not its square, as
a search of the whole text and a scan of all carriers for each identifier did. The comment text always comes from
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

- **What stands before the first statement stays (`lib/leading-trivia.mjs`).** recast prints a shebang through the
  `interpreter` node of the parser, and when the first statement is printed again it can swallow the line break of the
  shebang, put the shebang after the directives, drop a byte order mark, or lose a comment. `printJsPart()` therefore works
  on a text with no byte order mark (`splitBom()`) and with the shebang line turned into a `//` comment of the same length
  (`maskShebang()`), so recast treats it as any comment, and writes `#!` back after printing (`unmaskShebang()`, which throws
  when the line is not the first one any more). `assertLeadingTrivia()` then parses the source and the printed text with the
  plain parser and checks that the directives are equal and that the comments before the first statement of the source
  are still in the printed text, in order (more are allowed: a TODO, a comment moved from a removed statement). A throw is a
  `transform-error`. A `.ts` file that starts with a byte order mark and a shebang is parsed as the shebang being a comment.
- **A TODO goes above a directive for the next line.** `insertionIndex()` in `todo.mjs` puts a comment above the run of
  `NEXT_LINE_DIRECTIVE` comments (`eslint-disable-next-line`, `@ts-expect-error`, `@ts-ignore`, `prettier-ignore`, a coverage
  ignore, ...) that ends the leading comments of a node, `addCssTodo()` does the same for the comment nodes before a rule, and
  `spliceCarriers()` for an array element (`aboveDirectives()`). `eslint-disable-line` and a plain note are not directives. A
  second run finds the TODO through the directive, because `sitsBefore()` looks through other comments.
- **The comments of a removed import go to the import that took its name.** `removeNamedImport(j, root, declaration, specifier,
  { commentsTo })` appends them (as leading comments, after the target's own) to `commentsTo`, which `moveNamedImport()` sets to
  the declaration that now holds the specifier. A removed first statement still gives its comments to the next statement,
  before the ones that statement had, so a license header stays on top. The declaration itself is cut out of the printed
  text (`options.cut`, see "TODO comments"), so its neighbors keep their bytes. The one case left with the printer is a
  list that another rule also changed in length (README, Limitations).
- **Line endings.** The printer writes one terminator for a part (`workingTerminator()`: `\r\n` when CRLF is at least as
  common as bare LF, else `\n`). `printJsPart()` then calls `restoreLineEndings()`. A source with one kind of break gets
  it back everywhere (a lone `\r` too). A source that mixes kinds is aligned with the printed text by the longest
  common subsequence of its lines, computed twice (earliest and latest match, the second on the reversed arrays): a
  line that both alignments pair with the same source line takes that line's ending, a line that neither pairs takes the
  dominant ending, and a line that they pair differently, or pair in one and not in the other, is fine only when every
  line it could be ends the same way. Otherwise it **throws**, and `transformFile()` leaves the file alone as a
  `transform-error`: no heuristic may put a wrong ending on a line the tool did not touch. The README says the same.
- **A path comparison on a case-insensitive file system uses the file system, not strings.** `realpathNative()` returns
  the stored case, and `stat(..., { bigint: true })` the inode. `git ls-files --error-unmatch src/A.JS` does not match
  `src/a.js` even with `core.ignorecase`.
- **The Markdown report escapes what it did not author** (`markdownText()`). A message may hold a literal tag the tool
  names (`<style lang="less">`), a name from the project, or a source line. An entry can carry `quoted: [...]`, the
  fragments of its message that are the user's text (the parse-error entry quotes its line), and each becomes a code
  span with a fence one backtick longer than its longest run. Locations and file names are code spans. Everything else
  outside a code span has `\ & < > * _ [ ] | ~` and a leading `#`, `-`, `+`, or `1.` escaped. A transform that quotes
  user text in a message sets `quoted` rather than writing backticks. `plainText()` runs over the console report and
  every byte the CLI writes (a diff line included), so an escape sequence from a file name or a source line is printed
  as `\x1b`.
- **A regular expression with `$` on a growing slice, or a `slice` and `+` of the whole text per edit, is quadratic.**
  Read a run of white space with `trimStart()`/`trimEnd()`, test the text before an offset by walking backward from it,
  and build the edited text from pieces in one pass (`CssDocument.print()`, `isReference()` in `css-variables.mjs`). Add
  the input to `test/scan-complexity.test.mjs`.
- **Windows.** The suite runs on Windows in CI. Three rules keep it green. (1) recast ends a printed line with `os.EOL`
  (`\r\n` there) unless it gets `lineTerminator`: product code prints through `printTree()` (`src/lib/print.mjs`) or
  passes the terminator itself (`printJsPart()`), and tests print through `print()` in `test/helpers/parse.mjs`.
  `test/windows.test.mjs` fails on any `.toSource(` in `src/` without `lineTerminator`. To reproduce a Windows
  failure on another host, preload a module that sets `os.EOL` to `\r\n` (`node --import <file> --test ...`).
  (2) A path decision goes through `src/lib/paths.mjs` (`leavesDirectory()`, `insideRelative()`, `toPosix()`), which
  takes the `path` flavor, so the tests run the `path.win32` cases anywhere. Never test a path that was already turned
  into forward slashes with the platform `sep`, and compare `realpath()` results only (a temp path may be a short
  `RUNNER~1` name). (3) Reported paths are project-relative with forward slashes on every platform.
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
  one hop). `axios.get(url).params({ ... })` stays untouched. A token is a key of the `tokens` object of the config
  (`tokenProperties()`: the argument, or a branch of a conditional or logical expression, then its `tokens` property).
  The theme API takes `{ name, sizing, density, icons, colors, tokens, colorScheme }` and holds every token in `tokens`
  (`ThemeParams` in `handsontable/src/themes/types.ts`; any other top-level key only gets a warning from
  `validateKeys()`), so a key of `colors`, `icons`, `sizing`, or `density` that is spelled like a token is a palette entry,
  an icon slot, or a size. The generic note for a file that imports `handsontable/themes` skips those sections too
  (`inNonTokenSection()`).
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
  reports a `manual` entry for a call on another unresolved receiver in a hot file that sets the key. On a confirmed
  receiver, an argument that is a variable (or a member of one) holding an object literal of the file that sets the key
  gets one `manual` entry at the call that names the variable (`reportHeldObject()`), and the object is not renamed,
  because it may be used elsewhere. An argument the tool cannot resolve, and an object without the key, are silent. `medium` objects exist only in a file that imports or uses Handsontable (`isHotFile`), so a file with
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
- **A `cells` option can name its function** (`resolveFunction()` in `lib/option-objects.mjs`, used by `expandOption()` for
  a settings key and a JSX attribute): an inline function, a `useCallback(fn, deps)` or `React.useCallback` callback, or
  one identifier hop in the same file to a `const` initializer or a function declaration. A `const` and a declaration
  that nothing assigns to are certain, so the returned objects keep the confidence of the option. A `let`, a `var`, and
  a declaration that is assigned to (`findReferences()` finds a write) are `medium`: reported, rewritten only under
  `--aggressive`. An import, a parameter, and a destructured name are never resolved, and there is no object to report
  for them, so they stay silent. A function that is not passed as `cells` is never an option object, even when it
  returns `{ correctFormat: true }`. `resolveObjects()` also reads both branches of a conditional, for every option
  position. `columns` as a function still needs the function written there.
- **Indentation.** `printJsPart()` passes `useTabs` to recast for a file that `usesTabs()` (more lines start with a tab
  than with a space, ` * ` comment lines left out), and `restoreTabs()` fixes what recast still prints with spaces: the
  first statement of a block it reprints. A line the source already had is never changed, so a file that mixes styles
  keeps its minority lines. The width of a space indent is recast's own guess from the source (`guessTabWidth`), and
  `test/indentation.test.mjs` pins two spaces, four spaces, and tabs in `.js`, `.ts`, and a Vue `<script>`.
- **The invariant: the tool never changes the bytes of a string or template literal it did not deliberately edit.**
  recast keeps the text of an untouched node, but not for a literal that spans lines inside a node it prints again.
  It copies the original lines into the new layout and indents them with the line they now stand in, and neither
  of its two protections applies: the generic printer locks the indentation of a template literal's own lines
  (`lockIndentTail()`) only for a template it prints itself, and a slice of the original lines (the reprinter cuts the
  node out of its line) always drops the lock. So a one-line object that gets a key moved gains indentation in a
  multi-line template inside it, and the string changes. The same goes for a string with a line continuation, a JSX
  attribute string, a tagged template (`String.raw` shows it), and a template nested in a `${}`. Fixing recast was
  not an option, so `printJsPart()` enforces the invariant for every printed part (plain js, ts, jsx, tsx, and a Vue
  script block) with `guardLiterals()` from `src/lib/literals.mjs`:
  1. Before printing, `intendedLiterals()` reads the literals that span lines from the final tree. An element nobody
     edited is read from the original source, an edited one is read from the tree, so a deliberate edit is the
     intended text.
  2. After printing and `spliceCarriers()`, a plain `@babel/parser` parse of the printed text (no recast, so offsets
     are real) lists the same literals with their ranges. The two lists are matched by content apart from white space,
     in any order. A count that differs, or characters that differ, throw. A white-space difference is repaired by
     splicing the intended text back by range, last to first, and the text is parsed and compared once more.
  3. Only then does `restoreTabs()` run, with `linesInsideLiterals()` telling it which lines begin inside a literal
     (it skips them), and the result is checked again when the tab fix changed anything.
  The order matters: the sentinels of the carriers are not code, so the parse must follow `spliceCarriers()`;
  and the tab fix needs the literal ranges, so it must follow the guard. A throw becomes a `transform-error` and
  the file is left alone. A source with a line terminator that a `Lines` slice cannot return (a lone `\r`, `U+2028`,
  `U+2029`) is never repaired, only checked. A literal on one line cannot be re-indented, so it is not compared, which
  also keeps the elements a carrier holds out of the lists. The guard parses only a part that changed.
- **A transform that edits a literal reads it with `templateRaw()` or `stringRaw()`.** recast parses a copy of the
  source with the leading tabs of every line turned into spaces, so the `raw` of a template literal does not hold the
  tab of a continuation line, and an edit of that `raw` would write spaces. Both helpers return the original text of a
  node nobody edited (from the `Lines` of the parse, with tabs) and the current `raw` of an edited one. A new test for
  a literal edit uses a continuation line that starts with a tab.
- **`catalog:` specs.** `bump()` in `dependencies.mjs` never plans a range for them (`reportCatalog()`): the entry says
  to set the range in the `catalog` or `catalogs.<name>` section of `pnpm-workspace.yaml`, names the current value
  when `ctx.catalog` has it, and is dropped when `planRange()` keeps it or `rangeAdmits()` is true. It keeps the
  `range:<section>:<name>` merge key, so a chained run reports one entry per spot. The parser reads block style only. A
  quoted key, a quoted value, a trailing comment, and CRLF work, and flow style, an anchor, and a nested value give no
  entry, so the generic text stays. The tool never writes the workspace file.
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
  that `git diff <merge base> -- pnpm-lock.yaml` has no removed line. jscodeshift is a new dependency the team agreed to.
- `package.json` `files` limits the package to `bin`, `src`, the manifests, `rules/**`, and `custom/**` of every version,
  and the README, the CHANGELOG, and `LICENSE.txt` (a copy of the root file, pinned by `test/package-license.test.mjs`). Tests, fixtures, tools, and the generated diffs stay out. After a change to it, run `npm pack
  --dry-run --json` in a copy of the package outside the monorepo.
- **Method rules have no type information, so the receiver is the safety story.** `methodMove` rules use
  `receiver: "instance"`: a call is rewritten only on a receiver that `isInstance()` confirms. An unconfirmed receiver
  gets a `manual` entry only when its name is on a short grid-name list (`GRID_NAME` in `lib/hot-bindings.mjs`: `hot`, `grid`,
  `table`, ...). A generic receiver (`editor.undo()`) stays silent, because `undo` and `redo` are common names. A
  receiver that is already a `via` call (`x.getPlugin('undoRedo')`) is never rewritten, which keeps the rule
  idempotent. A rule has no list of names that rewrite on any receiver: `isUndoAvailable()` is a valid call on the
  plugin, so such a rewrite would break working code.
- **`receiver: { plugin }`** (`methodRemove` and `methodMove`, and `context.receiver` of `optionRename`) names the
  plugin key or keys the receiver must be. `isPluginReceiver(path, keys)` in `lib/hot-bindings.mjs` says yes for
  `<x>.getPlugin('<key>')` (optional chaining included) when `<x>` is an instance, and for a variable or `this` member
  that the file sets from such a call, one hop, when every value of the name is a listed plugin on an instance (see "A
  name is a receiver only when every value it can hold qualifies" below). `<x>` is an instance when `receiverOfGrid()`
  says `instance`: the same rule as `updateSettings()` and `hot.undo()`. `pluginCallOf()` returns the key and that host
  (`instance`, `unknown`, `other`). A host the file shows to be something else (`other`: a local object, an instance of
  a local class in a variable, an import, a function) gives no plugin and no report, so
  `fake.getPlugin('manualColumnResize').saveManualColumnWidths()` stays; `unknown` (a global, a parameter, `this.hot`
  that the class never sets, a call result) is a `manual` entry through `isPartlyPlugin()`. `isPlugin()` stays
  syntactic (any `getPlugin()` call is a plugin and not the grid), `pluginKeyOf()` in `lib/ast.mjs` stays syntactic
  too, and `isSimpleReceiver()` of `methods.mjs` depends on that. `--aggressive` does not apply: the method rules have
  no medium tier and the `callArg` path is always high. A looser rule would take an `unknown` receiver named like a
  grid (`isGridNamed()`, the `GRID_NAME` list: `hot`, `grid`, `table`, `this.hot`) for the grid: `confirmsHost()` in
  `collectHotBindings()` is the one place to make it. Measured on the shipped fixtures and the 2116 docs examples
  that name Handsontable, the strict rule loses no rewrite of a released fixture and none of the docs, and one of the
  19.0 draft (its fixture declares the grid now); a function parameter named `hot` is reported, as for `hot.undo()`.
  `getPlugin()` upper-cases the first
  letter of its argument, so `'exportFile'` and `'ExportFile'` are the same key here too (`registryName()`). Anything else is never edited. A
  report `manual` happens only when the receiver is unresolved (`isUnresolvedReceiver()`: a global, a parameter, or the
  result of another call) and is not `this`, `super`, a member chain rooted at one, a local object or class, an import,
  or the plugin of another key. `18.0.0/resize-state-methods` uses it, so `storage.saveManualColumnWidths()` and
  `super.loadManualRowHeights()` stay untouched. `receiver: "any"` remains for a `methodRemove` rule whose names are
  unique to Handsontable, and it skips a name the file declares itself. A name that is a listed plugin on one path and
  something else on another (`isPartlyPlugin()`) is reported, like an unresolved receiver.
- **A name is a receiver only when every value it can hold qualifies (`lib/hot-bindings.mjs`).** `isInstance()`,
  `isPluginReceiver()`, and the holders of a `useRef` read the whole history of a name: the initializer and every
  later write anywhere in the file, in any scope (`valuesOf()` gives it). A plain, `||=`, `&&=`, or `??=` assignment adds
  a value, unless the value is `null`, `undefined`, or `void 0`: a method call on those throws before and after a rewrite,
  so such a write (`this.hot = null` in a teardown, `let hot = null`) is neutral. A name with only neutral writes has no
  value and is no receiver. Any other write makes the history opaque: a compound or update operator, a destructuring target, a `for`
  head, a parameter, a catch parameter, a name that a function or a class also declares, and a `var` declared twice
  with another kind of declaration. An opaque name, a name with no value, and a name with one foreign value are not a
  receiver. A declaration with no initializer and one qualifying assignment is. A type annotation (`Handsontable`,
  `Core`, `HotInstance`) is the other way in, because the compiler holds every value to it. A type of the project is the
  other way out (`isForeignType()`: an annotation of a name or a class field, or a cast with `as` or `<T>`, to a type
  that is not a grid instance type, a ref holder, `any`, `unknown`, `never`, or `const`): `new Handsontable(el) as MyUndo`
  is not an instance, and a name declared `hot: MyUndo` is never one (`History.foreign` blocks the fixpoint, and
  `valuesOf()` still answers, so a settings object typed that way is still found). `satisfies` does not change the type
  of the value and is passed. Instances are settled by a
  least fixpoint, so a name set from another name counts once that one does, and a cycle never does. A `this.x` member
  is the same, keyed by class and by `static`: `this` must be the instance of the class, so the walk up from it stops at
  a function, an object method, a getter or setter of an object literal, and a nested class, and passes an arrow
  function; a static method, property, and block read the static members. A class that assigns `this[key]`, passes
  `this` to `Object.assign`/`defineProperty`/`defineProperties`/`setPrototypeOf`/`Reflect.set`, or has a computed
  member has unreadable members, and none of its members counts. A method or accessor of the same name makes the member
  opaque. **A `this.x` member is also judged by every write of the name `x` in the file, on any object** (`NameWrites`
  in `collectHotBindings()`): `y.x = v` and `y['x'] = v` (any `y`), a key `x:` of any object literal (so
  `Object.assign(y, { x: v })` too, and an `ObjectMethod`), a field, accessor, method, or parameter property of that
  name in any class (a subclass that sets it included), and `Object.defineProperty(y, 'x', ...)`. A value that is not
  neutral and is neither a grid nor a read of a member of the same name (a copy of what the name already holds)
  blocks the name (`blockedNames`, found by `settleAll()`: settle, judge the names, settle again without the blocked
  ones, until no name is added). The same union is part of `valuesOf()`, so the option resolver (`hop()`) and
  `receiverOfGrid()` see an outside write too, and of `keysAt()`, which answers for the plugin keys of a name. A typed
  seed (`x: Handsontable` on a field) still wins: the compiler holds every value to it. A class whose base class the
  file does not show counts through what the class itself assigns or declares, as before. Not seen: a write through a
  computed key on another object (`y[k] = v`), and `Object.assign(y, source)` with a source that is not an object
  literal. **`.hotInstance` counts as the grid by its name** (`classify()`) only while `hotInstanceTrusted()`: no write
  of the name is a value that is not a grid, `null`, or `undefined`, and no method or accessor has the name. A
  declaration with no value or a neutral one (`data() { return { hotInstance: null } }`, a class field) is neutral,
  like a variable's. In a Vue options object `this` is not the class, so `this.hotInstance` rewrites through this name
  trust only; a `this.hot` there never resolved. A `ref(null)` holder (`hotInstance.value.undo()`) never rewrote
  either: only a typed `ref<Handsontable>(null)` is a holder. A copy (`this.hotInstance = this.$refs.hot.hotInstance`) is not a foreign
  value, or the trust would end on a cycle. When the name is not trusted, `this.hotInstance` still resolves through its
  class history or a type. `var` is hoisted to a namespace body and a class static block too (`declarationsOf()`), and bindings carry
  the node of their scope. The histories are keyed by the declaring identifier node, because a rebuilt scope cache
  hands out new binding objects. The same history decides `isUnresolvedReceiver(path, bindings)`, the option object
  that a variable stands for (`createResolver()` in `lib/option-objects.mjs` follows a name only when it holds one
  value), and the theme variables of `theme-tokens.mjs` (every value a theme, and a `require` binding that the file
  sets again stops counting). The first argument of `updateSettings()` is judged by its receiver (`receiverOfGrid()` in
  `lib/hot-bindings.mjs`): a receiver `isInstance()` confirms gives a high grid object, a receiver the file does not
  show (a global, a parameter, a call result, a `this` member the class never sets or sets from a call) gives a medium
  one in a hot file (reported, rewritten under `--aggressive`), and a receiver the file shows to be something else (a
  local object, class, or import, a plugin from `getPlugin()`, `this`, a `this` member that holds only local values)
  gives none and `claimed`, so the key heuristic does not take the object either. `analyzeOptionObjects()` returns the
  claimed object literals next to the option objects (those that no grid takes too), and `isClaimed(path, claimed)` is
  true for a node in one, at any depth. Every path that reports on an object honors it: `reportUnrecognized()` in
  `options.mjs`, the `property` matcher of `detect` (with or without `in`; `hook` goes through it), and the method
  sites of `reportDynamicOptions()` and the dynamic `property` matcher (`setCellMeta()` and `setCellMetaObject()` on a
  receiver `receiverOfGrid()` calls `other`). An assignment (`x.numericFormat = ...`) is kept, because a local object
  literal is often a column that the file builds. A new reporting path needs the same check.
- A `methodRemove` rule's `advice` may use `{name}` too, so the TODO of a call that was not confirmed (the receiver may be
  another object) names the method in its first sentence: `19.0.0/resize-state-methods` starts with "Replace {name} with
  your own store". `18.0.0/resize-state-methods` does not, so its TODO text is unchanged. A `methodRemove` rule's
  `message` may use `{name}` for the method (`name()`). The report entry and the TODO then lead
  with it instead of "`name()` is removed", which is wrong for a deprecated no-op (`18.0.0/resize-state-methods`).
  Keep that lead under 40 characters, so the TODO still gets the next sentence that says why the call was kept.
- `methodRemove` deletes a call only when it is a whole expression statement (`await` and `void` allowed), the call
  has no arguments, and the receiver chain is made of identifiers, `this`, member reads, and `getPlugin('<literal>')`
  (`isSimpleReceiver()`): `createGrid().getPlugin(...)` and `(await init()).getPlugin(...)` keep the call, because the
  statement has effects of its own. The statement is cut out of the printed text (`ctx.removeStatement()`), so its comments
  stay where they stood, a license header on the first statement survives, and a block that held only the call keeps its
  braces on lines of their own. The comments of a removed statement are never dropped when the cut is refused
  (`pruneKeepingComments()`, the fallback): they move to the next statement, else the previous one, else the enclosing
  statement. A used result, an arrow expression body, and the body of a braceless `if` or loop keep the call and get a
  TODO on the enclosing statement. A removal can leave an empty block, which stays.
- `methodMove` rule shape: `methods` maps the old name to the new one, `via` is the call that reaches the new home,
  `properties` lists names that become the `via` call (`undoRedo: null`). Optional chaining is kept by building the
  new links as optional-chain nodes: the first link takes over the `?.`. Computed access (`hot['undo']()`),
  assignment targets, references without a call, and destructuring are reported, never rewritten.
- `callUnwrap` resolves the callee through `resolveNamespaceMember`, a `const` alias (`const { sanitize } =
  Handsontable.helper`), or a destructured member of the namespace (`const { helper } = Handsontable`, also
  `{ helper: tools }`), which only this transform follows (`memberOf()`; `resolveNamespaceMember` stays as it was for the
  other rules). An alias that is exported (`export const clean = Handsontable.helper.sanitize`) is a `manual` entry,
  because its uses are in other files; an alias that is only declared is silent. The 17.1 exports map has no `handsontable/helpers/*` entry, so a named import of the helper
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
  `noKeyAdvice`, which `validateRule()` requires when the advice uses `{optionKey}`; it replaces the advice only, and `export-removed.mjs` expands a `message` with the message itself in that place, so `validateRule()` rejects `{optionKey}` in a `message` when `optionKeys` has a `null`, whatever `noKeyAdvice` says). Within one run the first matching rule wins for `exportRemoved` and `namespaceType`, so a specific
  rule goes before the wildcard, or the wildcard lists it in `except`.
- `reportOpaqueReferences()` (without `all`) also reads a runtime `import()` of a module that survives: a member read of
  it (`import('m').Name`, `(await import('m')).Name`), a destructuring of the awaited module, a name that holds it and is
  read as `ns.Name`, and a `.then()` callback that destructures the name or reads it from its parameter. A bare
  `import('m')` and a read of other names stay quiet.
- **A wildcard re-export is a reference to every name of its module.** `reportOpaqueReferences()` reports an `export * from`
  and an `export * as ns from` of a source whose names a rule renames or moves (`isWildcardReExport()`), once per rule, and
  `export-removed.mjs` leaves one TODO per rule on it, worded "may pass on" and naming every name of the rule: a rule can cover
  several modules or names, and one module holds only some of them. The text of the file never spells the names, so both transforms also run
  on a file that matches `WILDCARD_EXPORT` (`export *`) when none of the names appears in it. `export-rename.mjs` reports the
  JSDoc types that still say the old local name after it renamed an import (`reportStaleJsdocTypes()`): one entry per
  comment line, `@tag {...Name...}`, never an edit.
- **`namespaceType` checks the scope at the reference.** `capturedBy()` in `namespace-type.mjs` looks up the local name the
  new reference would get (the existing import's local name, else the imported name) from the reference, and a binding that
  is not at the top level (`binding.scope.type !== 'Program'`: a type parameter, a block-scoped type, a namespace member)
  would capture it, so the reference is reported and left. A top-level binding is `addNamedImport()`'s business.
- **`cssVariable` does not make a name point at itself.** `applyToDeclaration()` leaves a declaration alone, and reports, when
  its container defined the new name when the run began (`declaredAtStart()`: a name that an earlier rename of this run gave
  to a declaration does not count): `--new: var(--old, 4px)` would become a reference to itself, and `var(--old)` next to
  `--new: 1px` would read the new value. Only the same container counts: another rule that defines the new name may match
  other elements, so the tool cannot call it a conflict, and the guide asks for the rename anyway. A name in a string or
  `url()` of an at-rule is reported and not renamed, as in a declaration value.
- **A match whose node has no `loc` gets the line of its first child.** recast takes the location off the expression right
  after `export default`. `lineOfNode()` returns the line of the first descendant that starts at the same offset, so the
  entry has a line and a marker. `markerTargets()` sends a JSX child that is an expression container (`{ok && <X />}`) to the
  element inside it, so the marker is a JSX comment in front of that child and not a comment on the enclosing statement.
- **Phase 2 reads only the `package.json` files the run discovered.** `migrate src` leaves the one above `src` alone, so
  `run()` names it in a note (`unreachedPackageNotes()`): the nearest `package.json` of each path argument that the run did
  not discover, when it asks for an older range of a package a `dependency` rule bumps.
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
  anchor must exist on the page of the manifest. Neither is a change of 18.0, which is why the page has no section: the
  core undo methods never existed in 17.x or 18.x, and the export option `columnHeaders` was renamed in 17.1 (deprecated
  since then, removed in 19.0). Their entries still link the page itself, because a rule with no `guide` gets the
  page URL. The theme registry import rules (`theme-registry-imports-main` and `-base`) do have a section, "Import the
  theme functions from the themes entry point", because the 18.0 typings did drop those names. The core undo methods were already gone from runtime and typings in
  17.0 (`hot.undo`, `hot.undoRedo`, `clearUndo`, `isUndoAvailable`, `isRedoAvailable` are in none of `core.js`,
  `core.d.ts`, or the undo plugin of the 17.0.0 and 17.1.0 packages, and the plugin never sets them on the
  instance; 16.2.0 had `isUndoAvailable` and `undoRedo` on `core.js`). So a call on 17.x threw a `TypeError`, and the
  rule is not a cleanup of working code: it makes a call work that never did, and its message and advice say so. A
  read in a test position never passed, so `methods.mjs` reports it and what it guards instead of moving it
  (`isTestRead()`: the test of an `if`, a loop, or a conditional, the left operand of `&&`, `||`, `??`, `!`, `typeof`, a
  comparison whose answer changes when the read stops being `undefined` (`== null`, `!= null`, every comparison with
  `undefined`; `=== null` and a comparison with a string give the same answer before and after, so they are no test),
  `Boolean()`, `'x' in hot`, and the root of an optional chain). The entry says that the member was `undefined` on 17.x
  and a rewrite would change what the test answers: it never claims that the test never passed, which `!x` falsifies. A
  test guards every use of the same receiver text and name in the same function or in a function nested in it
  (`enclosingFunctions()`), also after the use, because an early return is a guard too. The root of an optional chain
  is reported and guards nothing else. `methods-undo-guarded` and the `methodMove: a member that code tests` block of
  `methods.test.mjs` pin it. The `columnHeaders` export
  option is deprecated in 17.1 and removed in 19.0, and only the 19.0 guide has a section for it.
- **`detect` reads each node type once per part.** `createEnv()` hands every matcher `env.find(type)`, a cache of
  `root.find(type)`, and `env.dynamicSites()`, the assignments and `setCellMeta()` calls. A `detect` rule never edits the
  tree, so nothing makes an entry stale. A matcher that needs a node type calls `env.find(type)`, never
  `root.find(type)`. `test/scan-complexity.test.mjs` counts the walks (`countTraversals()`) for 2 and for 20 copies of
  each matcher, and for the same rules in one migration and in three.
- **What a transform derives from the tree is kept between transforms and versions while no edit is recorded
  (`ctx.derived(key, compute)`).** `markChanged()` is the one place that records an edit: it counts a revision on the
  part, and a value of an older revision is dropped on the next call (`ctx.removeStatement()` counts one too). The
  bindings of a file (`hotBindingsOf(ctx)`, which every transform that reads them uses), the option analysis, the
  resolver, the dynamic sites, and `findOf(ctx)` (the Collection of one node type) of `detect`, and the fact scan of the
  `dependency` module go through it, so a file is read once for them and not once per version. A caller never changes
  what it gets. A transform that edits the tree calls `ctx.markChanged()` after the edit, as the contract says, or a
  later reader sees the old tree. `matchImport()` of `detect` reads through `rootFrom(env.find)`, which answers
  `find(type, filter)` from the cached Collection. What is left (the import scans of the transforms that edit, one set
  of walks per rule) would need an index that every transform keeps in step, and was left alone.
- **Two flagged JSX elements on one line get a marker each.** A `detect` match for a JSX attribute carries the column of
  the attribute and its element (`matchAt()`), and `uniqueByLine()` keeps one match per line and element. The report
  input has `markColumn` (and `markColumns` for a collapsed group), the mark keeps `sites` of line and column, and the
  marker index answers `find(line, column)` with the outermost node that starts there, so `markerTargets()` climbs from
  the attribute to its own element. A column no node starts at falls back to the line.
- **A factory is held by the uses of the factory (`factoryHeld()` in `lib/holders.mjs`).** An object that a function
  returns (an arrow body, a `return`, not a `useMemo`/`useCallback` callback, which stays the object's own) is held by
  the uses of the function: `cells: make` and `{ cells() {} }` of an options object (held only when that object is held),
  and calls whose result goes to the grid or to a name whose uses are all the grid's, are the grid's own. An export of the
  function, a method of an exported class or object (`isExposed()`: `export`, `module.exports = ...`, an export list), a
  call result or the function handed to another call, an alias, and a return keep the object and name the use. A
  `map()` callback follows the array it answers with, the other iteration callbacks drop the answer, and an immediately
  invoked function follows its call.
- **`detect` rule shape:** `{ id, kind: "detect", severity?: "manual" | "warning", files: ["js" | "css" | "template"],
  requires?: "hot-file" | "option-object" | "none", emitsFact?, unlessFileMatches?, mergeKey?, match, message, guide }`.
  `message` and `files` are required by `validateDetectRule()`, which runs when the manifests load, and which rejects an
  empty list, an empty name, and a non-string in every list-valued matcher field (`import`, `call`, `hook`, `property`,
  `annotatedObject`, `namespaceMember`, `whenAnyKey`): an empty list passes `every()` and would match nothing (the shape check
  only requires `match`). `unlessFileMatches` is a regex on the part text, and `mergeKey` makes the reports of two
  rules on one line collapse into the later one. `requires` defaults to
  `hot-file`: a js part must import or use Handsontable. `option-object` makes `property` and `hook` matchers sit in
  an object `findOptionObjects` finds, or on a wrapper element. It never applies to css or template parts.
  `match` is one matcher object, `{ anyOf: [...] }`, or `{ allOf: [first, ...gates] }` (the first reports, the others
  must match somewhere in the part).
- **`detect` matchers** (js only unless noted): `import` (module or `module/...`, import, re-export, `require`,
  `import()`), `property` (dotted path; `withKey`, `valueMatches` on literal strings only, `valueIs` for the other
  values: `true`, `false`, `null`, `"array"`, `"function"`, `"object"`, `in: "option-object"`),
  `call` (`argMatches` reads every string inside the arguments, `receiver` is `"instance"`, `"grid"` (a confirmed instance or
  a receiver the file does not show, never one it shows to be another object), `{ plugin: key }` (`x.getPlugin('<key>')`, or
  a name or `this` member set from it, also when it is the plugin on some paths only: `18.1.0/loading-markup` uses it so a
  `show()` of another object in a file that uses the loading plugin stays quiet), or the receiver text),
  `hook` (option key, JSX prop, `addHook`, `addHookOnce`, `Handsontable.hooks.add`/`once`), `string`, `selector` and
  `regex` (also css and template; modifiers `in: "strings"` and `code: true`, see the traps of the 19.0 draft),
  `pluginRegistration` (`withoutPlugin`), `missingOption` (`whenAnyKey`, `whenValueMatches`, `unlessFileMatches`). `selector`
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
- A `handsontable` or wrapper dependency whose spec installs from a repository or a URL (`isRemoteSource()`: `git:`,
  `git+...:`, `github:`, `gitlab:`, `bitbucket:`, `http(s):`, `ssh:`, scp-style `git@host:org/repo.git`, `owner/repo`)
  is never bumped, but it is one `manual` entry that
  says the tool cannot tell its version (`planRange()` still returns `skip`). `workspace:`, `file:`, `link:`, `portal:`,
  `patch:`, a path (`./x`, `../x`, `.\\x`, `/x`, `C:\\x`, `\\\\server\\x`), and a dist-tag stay silent. `isSourceSpec()` is the one
  predicate of `planRange()` and `minimumOfRange()`, so a port or a tag of such a spec is never read as a version. The note about a pin of `overrides`, `resolutions`, or `pnpm.overrides`
  names its own section. An entry of those sections with such a spec gets the same entry (`reportPins()`), and a
  `peerDependencies` range is never edited (see "Run model").
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
- **One hop, same file, is the resolution limit (`lib/resolve.mjs`).** `hop()` follows an identifier to its `const`
  initializer and `X.key` to a property of a `const` object literal, through `as const` and `satisfies`. A `let`, a `var`, an
  import, a parameter, a destructured name, and a second hop are `null`, and each caller treats `null` as "unknown", never
  as "absent". The `options` and `detect` transforms share it. `cells` functions keep their own resolver in
  `lib/option-objects.mjs`, which also reads `this.x` and `useMemo`. `const` fixes the binding, not what the object
  holds: a caller that concludes from what the object lacks asks `hop(path, { exact: true })` (and `spreadsOf()` the
  same), which answers `null` when the file writes to a member of the object (assignment, update, `delete`, a
  destructuring or `for` target, at any depth) or passes it to a call that may change it (`Object.assign(fmt, x)`,
  `configure(fmt)`; `new X(fmt)`, `Object.keys`, `Object.freeze`, `JSON.stringify`, `console.*`, and `Object.assign`
  as a source do not count). A caller that reports what it finds does not ask. `reportNestedHolder()`,
  `nestedKeyState()`, the `missingOption` merge, `withoutSiblingKey`, and the custom reader check ask.
- **`optionMove` and the value of the parent option.** When `numericFormat` is not an object literal that sets `culture`,
  `reportNestedHolder()` decides: a reference or a spread that resolves to an object that sets the key gets "... comes from
  a variable that sets culture"; one that resolves to an object that certainly lacks it (no spread of its own) is silent;
  one that does not resolve gets "... by hand if it sets culture", at any confidence of the object, because nothing is
  rewritten. The whole rule is skipped for a file that never writes `culture` (`mentions()`), so the cross-file case
  stays a documented limitation. A literal with its own `culture` moves, unless a spread follows the key in the same
  object (`spreadFollows()`): the spread can set `culture` again and win, so the move is reported. A spread before the
  key moves as before. `optionRename` does the same for a later spread in the object or among the attributes of an
  element (`{ columnHeaders: false, ...opts }` is reported), and for an earlier spread that can set the new name or the old
  one (`spreadBeforeMaySet()`: a spread the tool cannot read, or an object literal that has either key, a computed key, or a
  spread of its own that can). In 17.1, 18.x, and 19.0 an explicit `colHeaders` wins over `columnHeaders` in the export
  options (`normalizeExportOptions()`), so `{ ...opts, columnHeaders: false }` reads `opts.colHeaders` today, and the renamed
  key would win over it. A move whose value `canBeEmpty()` (`undefined`, `null`, `void 0`, a conditional with such a branch, a
  `??` or `||` whose right side is one, any `&&`) is reported: an own `locale: undefined` overrides the grid locale.
- **An object that something else holds is edited only when every use of its holder is the grid's own
  (`lib/holders.mjs`, `reportSharedObject()` in `options.mjs`).** `heldBy(objectPath)` climbs from the literal through a
  type assertion, an array, a property of another object, a conditional, and a `useMemo`/`useCallback` callback to the
  declarator, class field, assignment, or export that names it. A variable is judged by `findReferences()`, a class
  field or `this` assignment by every member read of the name in the file. Each reference is `fine` (`new Handsontable()`
  of an instance, `updateSettings()` of an `instance` receiver, or of an `unknown` one under `--aggressive`, a wrapper
  prop or spread attribute, a spread or a property in an object that is itself an option object, a member read, a
  destructuring, `typeof`, `!x`, `void x`, a comparison (`x == null`, `'k' in x`), the left of `&&`, a `while`, `do`, or `for`
  test, `Boolean(x)`, a write) or `other` (any other call argument, an alias, a return, an `export`, a component that
  is not a wrapper), and the first `other` makes the rule report with its text ("also passed to `x.configure()` (line
  6)"). Not every shape is named: an unknown parent says "used here". **A type names the holder:** an object found
  through `annotated` (an annotation, `as`, or `satisfies` of `GridSettings` and the like, whichever pass found it
  first), and everything inside it, is never held, because the compiler holds every other consumer to that type
  (`isAnnotated`). **A type of the project holds it** (`isForeignType()`: an annotation, `as`, or `satisfies` to a type that
  Handsontable does not export, `MyOptions`, `MyOptions[]`, `Partial<MyOptions>`, an inline object type; `any`, `unknown`,
  and `as const` do not count): any reader of that type sees the keys, so `heldBy()` answers "typed as `MyOptions`".
  **A part of the object that goes to other code holds the object too.** A member read (`cfg.columns`, `cfg.columns[0]`),
  a destructured name, an alias of a member, and the element parameter of an inline callback of `forEach`, `map`,
  `filter`, `find`, `some`, `every`, or a `for...of` loop are followed to their own uses (`classify(reference, true)`,
  `followNames()`). A member that only ends in an expression (`cfg.title + '!'`, `cfg.columns.length`, a template
  literal, a comparison, a write, `console.log()`, `Number()`) gives no object to anyone. `find`, `filter`, `map`,
  `slice`, `at`, and the like answer with the elements, so their result is followed on. A callback that is not written
  inline, an element returned from a callback that is not an iteration callback, and a method of the object that is not
  in the lists are `other`. A spread into another object is `spreadInto`, with the names the receiver set **before any rule edited
  it** (`around`, taken when the analysis is built): the answer must not depend on which object a rule reaches first.
  A move (`optionMove`) always conflicts, a rename when the receiver sets the new name or the old one after the spread,
  and a removal never does, because the removed option does nothing in the target version, and a check on the
  receiver would make run 2 differ from run 1 (run 1 deletes the receiver's own key).
- **`optionMove` takes `levels` and `reportWithout`.** `levels` (`grid`, `column`, `cell`) lists where the key may move;
  `Target.level` is the role of the object (`item.role` of `findOptionObjects`) or the component of the element
  (`HotTable` is `grid`, `HotColumn` is `column`). At any other level `reportWrongLevel()` reports `levelAdvice` and
  moves nothing. `onlyTypes` (a list of cell types) and `typeAdvice` do the same for the cell type: `moveInObject()` and
  `moveOnElement()` read the cell type of the object or element (`objectCellType()`, `elementCellType()`: its own `type`
  or `renderer` string, else the `type` of the settings object or `HotTable` element it sits in, through the array of
  `columns` or `cell` and a type assertion), and move only for a listed type. A `renderer` that is a listed name makes
  the column one too, because the numeric renderer formats with `numericFormat` whatever the type. A type that is not a
  string the file shows, a spread that can set it, an object that sits in no object the tool can see, and a column with
  no type anywhere are `unknown` and report `typeAdvice`. `numericFormat` is ignored in a text column and `locale` is
  not (it sets the collation of sorting and filtering), so `18.0.0/numeric-format-culture` lists `numeric`. The shared
  object check comes first. `18.0.0/numeric-format-culture` lists `column` and `cell`: a grid-level `locale` is read by the
  date, time, `intl-date`, `intl-time`, `intl-datetime`, and checkbox renderers, the autocomplete and multiselect
  editors, the text sort, the filter conditions, `search`, and the xlsx export (the `locale` readers of the 18.1.2
  package), so it would change every other column. `reportWithout` names a key of the holder that makes the `report`
  text unnecessary: the `report` of that rule says what 17.1 showed for a culture with no pattern (`isNumbroScheme()`
  in the 17.1.0 `numericRenderer/utils` was true for any `culture`, and `numbroFormatter()` formatted with
  `pattern || '0'`; `intlFormatter()` of 18.x gives `Intl.NumberFormat(locale, {})` for an empty object). **Do not
  write "1235" in that text:** numbro 2.5.0 formats `1234.56` with `'0'` as `1234.56` (`1234,56` with the de-DE
  language), every decimal and no grouping, while `Intl.NumberFormat('de-DE', {})` gives `1.234,56` and rounds
  `1234.5678` to `1.234,568`. `{ useGrouping: false, maximumFractionDigits: 20 }` matches numbro for every value
  tried, and is `DEFAULT_INTL_FORMAT` of the renderer; `maximumFractionDigits: 0` would round. The note stays out when
  the holder keeps a `pattern`, because the `numbro-pattern` rule speaks about it.
- **An option that custom code may read is neither moved nor deleted (`readerAdvice`, `lib/custom-reader.mjs`).** A rule
  with `readerAdvice` (the `optionMove` `18.0.0/numeric-format-culture`, the `optionRemove` rules
  `18.0.0/correct-format-removed` and `18.0.0/date-picker-config-removed`) reports instead of editing when
  `createReaderFinder()` cannot rule a reader out, at every confidence and under `--aggressive`. A reader is: a `cells`,
  `cell`, `afterGetCellMeta`, or `beforeGetCellMeta` key of the object, an enclosing one, or a wrapper element that sets or
  may set a custom editor, renderer, validator, or type (`mayAssignReader()`: a key of an object or an assignment to the
  meta inside the function or literal, a `cells` function whose returned value the tool cannot see or that spreads, and any
  function or object the file does not show, an import included); an
  `editor`, `renderer`, `validator`, or `hotEditor`/`hotRenderer` prop that is anything but a built-in name (a function, an
  identifier, a string that is not in `BUILT_IN_EDITORS`, `BUILT_IN_RENDERERS`, or `BUILT_IN_VALIDATORS`; `undefined`,
  `null`, `false`, and a regular expression validator are not), or a `type` that is not in `BUILT_IN_CELL_TYPES`, on the
  object or element or on an enclosing option object or element (merged settings reach every cell below them); a
  spread of the object itself that does not resolve (one hop, `exact`) or resolves to an object that holds a reader, and
  a computed key in it (an unreadable spread or key on an enclosing settings object says nothing, because
  `{ columns: [...], ...extra }` is too common); a built-in name that the file registers again with
  `registerCellType`, `registerEditor`, `registerRenderer`, or `registerValidator`; and a read of the option anywhere in
  the file (`.correctFormat`, `['datePickerConfig']`, a destructuring, an optional read, `'key' in object`; for
  `numericFormat.culture` also `as`, parentheses, the left side of `??`/`||`, and a nested destructuring). Only a read
  counts: `isWriteOnly()` in `lib/ast.mjs` is `true` for the target of a plain `=`, the operand of `delete`, and a
  destructuring or `for` head target (through parentheses and `as`), and such a member is skipped. A compound
  assignment (`+=`, `||=`) and `++` read the value too, so they count, and an object literal key is no member at all. The four name lists come from the
  `*_TYPE` constants of the 17.1.0 and 18.1.2 packages and of `develop` (`handsontable/src/editors`, `renderers`,
  `validators`, `cellTypes`): re-derive them when a release adds a name. The TODO names the reader without a line
  number (a comment is compared as text on the next run, and the layout moves a line), and the report entry adds the
  line. A reader in another file is out of reach, so a cell type that another module registers under its own name is
  custom, but a reader attached to the grid elsewhere is not seen. Per rule: `numeric-format-culture`,
  `correct-format-removed`, and `date-picker-config-removed` use the check. `export-column-headers` (both
  versions) does not: it renames a key in the literal argument of an export call on the plugin, an object that nothing
  but the plugin reads. The theme token and CSS variable rules do not either: a token is a key of the object passed to
  the theme API, and a variable name in a string is renamed together with the stylesheet (a key of an object that is not
  a style is reported, see below).
- **Option rules report code they cannot place (`reportUnrecognized()`), and never rewrite it.** In a file that uses
  Handsontable: an `optionMove` rule reports `<option>: { <key> }` in an object literal that `findOptionObjects` did not
  return, and on a component element that is not a known wrapper (the pair is distinctive on its own); `optionRename` and
  `optionRemove` report an attribute of such an element only when it passes `corroborated()` (two other known options, one
  not generic). A lowercase JSX tag never counts. A re-exported `HotTable` therefore gets entries and no edit. Do not
  extend this to other keys without a corroboration bar: it is the only thing keeping a look-alike element silent.
- **Arrays annotated with an element type** (`ColumnSettings[]`, `readonly ColumnSettings[]`, `Array<ColumnSettings>`,
  `ReadonlyArray<>`, `satisfies` one of them, also `Handsontable.ColumnSettings`): `addAnnotated()` in
  `findOptionObjects` adds the array's object elements at high confidence, with the role of the element type. An object
  annotated `Events` (also `Partial<Events>`) has the role `hooks`. `Events` is the exported hook map in 17.1 and 18.x;
  `Hooks` is the registry class and is not a map.
- **`detect` extensions.** `property` takes `viaReference` (with `valueMatches`): a reference is resolved one hop and tested
  as the string it holds, an unresolved one (or one that resolves to another reference or a call) matches with
  `variable: true`, and `applyRule()` then uses the rule's `variableMessage`. An object or a non-matching string is not a
  match. `annotatedObject` takes `recordEntries` with `withKey`: each entry of an object annotated `Record<K, Type>` that
  sets the key matches, at the key (so the line is the same as the sibling-`culture` match and `uniqueByLine` merges them).
  `hook` resolves the name through `stringOf()`, accepts `add()`/`once()` on a `const` alias of `Handsontable.hooks`
  (`isHooksRegistry()`; `new Set().add()` stays out), and matches a prop of a component that is not a known wrapper
  when it passes the corroboration bar (`matchHookOnElements()`). `missingOption` merges a spread of a same-file object
  literal (`resolveSpread()`), and the spreads of that literal the same way, to any depth (`readKeys()` keeps the
  objects it is reading, so objects that spread each other end); a spread of anything else, a prop included, makes the
  configuration unknown, and an unknown configuration is silent. The exception is a matcher with `reportUnresolved`
  (needs `whenAnyKey`): when the markup is visible in the keys the tool read, no visible key sets the option, and a source is
  unread, `applyRule()` reports the rule's `unresolvedMessage` with the unread sources named (`markUnknown()` collects
  them: a spread, the `settings` prop, a computed key). Only `18.0.0/html-without-sanitizer` sets it. `18.1.0/license-key-missing`
  has no markup to see, so it stays silent for an unknown configuration.
  `selector` tests `normalizeSelector()` of the text, so the scoping wrappers of component styles never hide a selector.
- **`cssVariable` and names built at compile time.** A stylesheet part whose code (comments blanked by
  `blankComments()`) holds `--ht-#{` gets a report for each quoted or unquoted map key or string equal to the name of any
  `cssVariable` rule without `--ht-`, in a `decl` or a leaf at-rule. The rule's own scan would skip the file, because the
  name never appears whole. It reports only. The entry names the key's line and sets `markLine` to the line the
  declaration starts on, which is where `cssTargetAt()` finds a node. A text match in a template literal reports the
  line of the match (quasi start plus the line breaks before it) and sets `markLine` to the quasi start.
- **`themeToken` knows `Handsontable.themes`.** The namespace member `themes` (`resolveNamespaceMember()`) is a theme receiver
  like a binding of `handsontable/themes`, because 17.1 and 18.x set `Handsontable.themes` (with `registerTheme`,
  `getTheme`, `reinitTheme`) on the namespace at run time. A chain from another object (`kit.themes.registerTheme()`) is not.
- **Several TODO markers on one JSX element are deduplicated across the whole run of comments before it.**
  `hasJsTodo()` and `addJsxTodo()` walk the same run of comment containers (`commentRunBefore()`), not only the nearest,
  or a second run would add the first marker again. `sitsBefore()` looks through other comments between a comment and
  the node, so several markers in a row in front of one node all count.
- **`ctx.todo()` and `ctx.comment()` look above the target too.** A transform picks the node by the layout it sees, and a
  comment on a one-line array element or object spreads it over lines, which gives a property a line of its own in the
  next run. So `comment()` in `runner.mjs` asks `anchorsAbove()` for every anchor above the target (a node target gets
  its path from a lazy index of the part) and treats a comment of an earlier run in front of any of them as the
  comment. The cost is the one of the generic markers: a spot deep in a statement that already carries the same comment
  gets none.
- **Twin rules report one spot once (`twins`).** A rule of a later migration that repeats a rule of an earlier one
  (`19.0.0/resize-state-methods`, `helper-sanitize`, `export-column-headers`) lists the earlier ids in `twins`, which
  `test/twin-rules.test.mjs` checks (an earlier rule of the same kind). `createContext()` in `runner.mjs` then gives the
  entries of the pair one merge key per line (`twin:<earliest id>:<line>`, policy `earliest`), so in a run that holds
  both the earliest rule owns the entry, and a later rule's `ctx.todo()` and generic marker are skipped. When only the
  later migration runs, over code the earlier one marked, `ctx.comment()` and `applyMarkers()` look for a comment that
  starts `TODO(handsontable-codemod <twin id>)` on the target and the anchors above it (`hasTwinTodo()`) and leave
  none, while the later rule still reports its entry. A rule that repeats an older one adds the id to `twins`. A
  stylesheet marker is found the same way (`addCssTodo()` takes the twin ids and looks through the run of comments before the
  node), so the Pikaday rules of 18.0 and 18.1, which also share a `mergeKey`, leave one marker in a stepwise run.
  `test/twin-rules.test.mjs` derives a signature for every kind (`exportRename`: source, from, to; `detect`: `mergeKey`) and
  fails for a rule that repeats an earlier signature without listing it, so the next pair cannot be missed. **The kept
  entry says what the latest twin of the plan says.** When a later twin reports the spot the earlier one already owns
  (`adopt()` in `createContext()`), a `manual` entry from a twin path (a `mergeKey` is not one: the Pikaday pair keeps
  the earlier text on purpose) takes the later message, the pending marker takes it too (`mark.text`), and a comment that
  `ctx.todo()` wrote into the tree in this run is restated (`restateTodo()`, from the `sink` of `addJsTodo()`). Id, guide
  link, and anchor stay those of the earlier rule. A CSS comment and a comment of an earlier run keep their words, so the
  entry and a marker of an earlier run can differ in the first sentence. Every rule finds its own marker of an
  earlier run whatever words follow the id (`hasEarlierRuleTodo()`, source comments only, so two spots of one rule on one
  statement keep a comment each). That keeps a second run quiet when the first restated the text of a chain, and when
  the first run's own edit made the same site read another way: under `--aggressive` run 1 deleted `correctFormat` and
  `datePickerConfig` from `{ correctFormat, datePickerConfig, columns: [...] }`, the object then no longer looked like a
  settings object, and run 2 reached `numericFormat.culture` through the "unrecognized holder" report, with its own words
  and its own anchor, so it added a second `numeric-format-culture` comment. `test/idempotency.test.mjs` (three runs under
  `aggressive`) and the fixture `18.0.0/options-aggressive-culture-site-after-delete` pin it. The cost is the one of the
  exact-words check: a spot added later under a statement that already carries a comment of the rule gets none, and stays
  in the report. The 18.0 rule says nothing
  about 19.0 where the 19.0 twin says it (`helper-sanitize`).
- **An inline Angular template is a `template` part.** `adapters/js.mjs` (`inlineTemplateParts()`) adds one read-only
  part for the `template` property of the object passed to `Component(...)` (a decorator or a call), when the file
  names `@angular/core`, as a string or a template literal (an expression `${}` becomes a space plus the line breaks it spans, so the lines
  after it stay the lines of the file, and the expression is never read). Its `lineOffset` is the line of the opening quote, so every rule that reads
  templates (`optionRename`, `optionMove`, `optionRemove` in `reportTemplateOptions()`, the `detect` matchers that list
  `template`, the report-only `cssVariable` branch) reports on it with the lines of the `.ts` file. It is report only
  and has no marker. The adapter's precheck also lets a file through that opens `<hot-table>`, `<hot-column>`,
  `<HotTable>`, or `<HotColumn>` and never names Handsontable.
- **`cssVariable` rewrites a custom property reference in a stylesheet, not any text that holds the name.** In a
  declaration value the name counts only as the first argument of `var()`, outside every quoted string and `url()`
  (`isReference()`), and the property of a declaration is the variable itself. Any other occurrence (`url(--ht-x.png)`,
  `content: "--ht-x"`, `transition-property: --ht-x`) gets a `manual` entry and no edit. `CssDocument` takes a
  replacer function as well as a string, so the check runs per match.
- **A TODO never changes what JSX renders.** recast prints the children of a JSX element it prints again with every text
  trimmed and every entity decoded (`&lt;` becomes `<`, which is not valid JSX). `printJsPart()` calls
  `intendedLiterals()`, which lists every JSX text that is not blank (a text of white space and a line break is layout,
  and JSX drops it) from the final tree, reading an unedited one from the original source, then `keepJsxEntities()`, which
  gives a text with an entity its raw spelling as the value, and `guardLiterals()` puts back the bytes recast trimmed.
  The texts are matched by what they say apart from white space (the decoded value), in groups, and a lost or added
  text throws, so `transformFile()` leaves the file alone. The carriers of marker comments keep the texts of the
  element they take out of the tree (`jsxTextsOf()`). A CRLF source compares with the line breaks normalized.
- **`referenceSpace()` knows what is not a reference:** the qualifier of `import('./mine').Config`, a Flow object type key
  and function type parameter name, and the pattern of a parameter of a function type, a construct or call signature, a
  method signature, and a declared function (`{ Config }: any` in `type G = ({ Config }: any) => void`). A rename never
  touches them.
- **A package add reads the `package.json` files above it (`ctx.ancestors`).** `18.0.0/dependency-hyperformula` does not add
  `hyperformula` to a package when a `package.json` above it declares it at a range whose lowest version the new range
  does not allow (or at a spec with no version: `catalog:`, `workspace:`): it reports `Update hyperformula in <file> to
  <range>`, and names the nearest such file. A declaration above that allows it still gets the add. The runner reads the
  files above (`packageFilesAbove()` in `lib/facts.mjs`) once per run, past a leading byte order mark (`stripBom()`:
  npm accepts one and `JSON.parse` does not). A file above that cannot be read (invalid JSON, not UTF-8, not an
  object) stays in `ctx.ancestors` with `manifest: null`: the add is a guess then, so the rule reports `Check
  <package> in <file>` and adds nothing below it, unless a readable file above declares the package compatibly. Every
  other `JSON.parse` of a user file in `src/` goes through `stripBom()` already (`versions.mjs`, the `runner.mjs` read
  of the package being edited, `adapters/json.mjs`); the ones left read the package's own files.
- **`cssVariable` renames the strings of a style, not the keys of the project's own maps.** A string that is the key of an
  object literal, or a computed member key, is renamed only when the object is a style: a `style` prop or key, a variable
  or key with `style` in its name, a `CSSProperties`-typed or `as`/`satisfies` object, `Object.assign(<style>, {...})`,
  `.css({...})`, and `el.style[...]`, `getComputedStyle(el)[...]`. Any other key gets a `manual` entry, because the code
  that reads the map is not in sight. A string that is not a key (`style.setProperty('--ht-x')`, `var(--ht-x)`, a
  template literal of CSS-in-JS) is renamed as before.
- **`methodMove` does not rewrite an optional call.** `hot.undo?.()` is reported: the plugin method always exists, so the
  rewritten call would run where the old one did nothing (`hot.undo?.() ?? hot.getPlugin('undoRedo').undo()` would undo
  twice). `hot?.undo()` still moves, because the optional link is the member.
- **`detect` vocabulary added with the 19.0 rules.** `property` takes `<hook>` for every hook the core registers
  (`lib/hook-names.json`, a copy of the `REGISTERED_HOOKS` of `handsontable/src/core/hooks/constants.ts`; only `19.0.0/hook-set-to-null` uses it, and the test that compares the copy with the core prints a diagnostic and never fails, because another team changes that list: it fails only for a hook that a rule names and the copy lacks), and
  `valueIs: null` also matches a conditional with a `null` branch and `a ?? null`. `withoutSiblingKey` (one-segment path,
  not with `siblingKey`) wants an object or element that certainly lacks a key: no such key, no computed key, no spread
  that does not resolve (`exact`) or that holds it. It reads js and JSX, not templates and not assignments.
  `18.0.0/date-default-format` and `time-default-format` use it: 17.1.0 defaults `dateFormat` to `'DD/MM/YYYY'` and
  `timeFormat` to `'h:mm:ss a'` (`metaSchema.js` of the 17.1.0 package), and 18.0 reads ISO 8601 only, so a column
  with `type: 'date'` or `'time'` and no format key needs its data checked.
- Detect negative fixtures must pass the adapter precheck, or they prove nothing: put the word Handsontable in a
  comment. `report.json` is matched as a subset, so `test/detect.test.mjs` asserts the empty reports.

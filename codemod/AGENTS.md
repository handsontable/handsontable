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
- Smoke test: `node codemod/bin/handsontable-codemod.mjs migrate --list --from 17 --to 18.1`.

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
| `src/adapters/*.mjs` | File type to parts and back. `vue.mjs` and `template.mjs` are stubs. |
| `src/lib/todo.mjs` | The only writer of TODO comments. |
| `src/discover.mjs`, `git.mjs`, `report.mjs`, `diff.mjs` | Support modules. |
| `versions/<semver>/` | `manifest.json`, optional `custom/*.mjs`, optional extra rule files, `__fixtures__/`. |
| `test/*.test.mjs`, `test/helpers/` | Tests (`node:test`). Helpers are not listed in the test script. |

## Run model

1. `resolvePlan()` loads every manifest, resolves `--from` and `--to`, and selects manifests with
   `from < version <= to`. A partial `--from` stands for the end of its line (`17` means "any 17.x"), a partial
   `--to` for the highest known manifest of that line (`18` means the latest 18.x). `--from` falls back to
   `node_modules/handsontable/package.json`, then the `package.json` range minimum. `--to` defaults to the latest
   `released` manifest. `draft` manifests need `--include-draft`.
2. The git guard refuses a dirty tree (exit 2) unless `--allow-dirty`. It does not apply to `--dry-run`,
   `--list`, `write: false`, or a directory outside a git repository.
3. `discover()` lists files (`git ls-files -z --cached --others --exclude-standard`, or an fs walk), drops
   `node_modules`, `dist`, `build`, `coverage`, `.git`, `*.min.*`, `*.d.ts`, files deleted on disk, and any
   extension no adapter handles. JSON is limited to `package.json`. A file named on the command line bypasses the
   generated-output filter.
4. Phase 1 visits every file through `transformFile()`: adapter by extension, skip when no selected rule has a
   registered transform for the adapter's kinds, skip when the adapter's cheap `precheck` regex does not match,
   parse once, run versions ascending and kinds in `KIND_ORDER`, print only parts that called `markChanged()`.
   Parse and transform failures become `parse-error` and `transform-error` warning entries, the file is left
   byte for byte alone, and the run ends with exit code 1.
5. Phase 2 visits only `package.json` files and runs the kinds in `PHASE_TWO_KINDS` (`dependency`) after phase 1
   has filled `ctx.facts`.

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
| `report(entry)` | Add `{ ruleId, severity: 'changed' or 'manual' or 'warning', line?, message }`. The runner fills `file`, `guideUrl`, and adds the part's `lineOffset` to `line`. Identical entries collapse. |
| `todo(target, ruleId, text)` | Leave `TODO(handsontable-codemod <ruleId>): <text>` before a js node or path or a postcss node, once, and add a `manual` entry. Returns whether a comment was inserted. It calls `markChanged()` itself. `json` gets the entry only. |
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
the common fields (`id`, `kind`, optional `guide`, `safe`, `minConfidence`, `message`, `advice`). The field sets
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
2. Give each rule an id `<version>/<slug>`, a `guide` anchor that exists on the page, and `safe`.
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

`options.json` may set `aggressive` (boolean) and `only` (array of rule ids). Put the non-match in the fixture of
the rule, for example a longer name that shares a prefix. Fixture directories are excluded from lint by
`.eslintignore`.

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
- The `json` adapter prints with `JSON.stringify`, keeping indent, line ending, and trailing newline. Other
  formatting of an edited `package.json` is normalized.
- Adding the package changed `pnpm-lock.yaml`. jscodeshift is a new dependency that needs team sign-off before the
  package leaves draft.

# Settings JSON Schema and `validateSettings()`

The public `handsontable/settingsSchema` entry (`src/settingsSchema.ts`): `settingsSchema`, a JSON Schema
(draft 2020-12) of the grid, column, and cell options plus the hooks, and `validateSettings()`, which checks a
settings object against it and against what the page registers. Guide:
`docs/content/guides/configuration/validate-settings/validate-settings.md`.

## What it owns and what it does not

- `schema.generated.ts` is **generated and gitignored**. `scripts/generate-settings-schema.mjs` writes it, run as
  the `build:settings-schema` task. `build:es`, `build:commonjs`, `build:types`, `typecheck`, `lint:eslint`,
  `lint:eslint.fix` and `test:unit.jest` depend on it, and the parallel `lint` pipeline lists it too, because its
  scheduler runs only the tasks a pipeline names. A bare `jest` or `tsc` outside the task runner fails on a fresh
  checkout until one of those has run. Never commit it and never edit it.
- It reads two sources and owns neither. `metaSchema.ts` decides **which** options exist and their levels
  (`@configScope`), plugin (`@category`) and `@since`. `GridSettings`, `ColumnSettings` and `CellMeta` decide the
  **value types**, through the TypeScript compiler API, because the JSDoc `@type` has no enums. An option the types
  do not declare falls back to its JSDoc `@type` (10 options as of 19.0). A new option therefore needs no change
  here, but a new option the types do not declare gets only the coarse JSDoc type.
- **Core must not import this module**, and neither may anything core imports. The schema is about 100 KB of JSON
  (the subpath bundles to about 80 KB minified, 19 KB gzipped), and the UMD bundles must not carry it. Nothing
  validates settings on its own: `new Handsontable()` and `updateSettings()` never call `validateSettings()`.
- The hooks are not generated. `schema.ts` adds one property per hook from the hook registry when the module
  loads, and `validateSettings()` asks `Hooks#isRegistered()` at call time, so a hook registered later passes too.

## The traps

- **A value JSON cannot hold goes in `x-handsontable.runtimeTypes`, never in `type`.** A function, a `RegExp`, a DOM
  element or a class instance is not a JSON type, so a JSON validator must reject it in a JSON document, while
  `validateSettings()` accepts it at runtime. A node with no JSON form at all is `not: {}` plus `runtimeTypes`.
- **A default must pass its own entry.** An option whose `metaSchema.ts` default is `null` gets `null` added to its
  type even when the TS type omits it (`colHeaders`). `schemaCoverage.unit.js` checks every default.
- **Levels come from `@configScope` and nothing else.** A wrong tag shows up as a `wrongLevel` false positive on a
  documented configuration. Fix the tag (and re-run `generate:option-levels`), not the validator.
- **The column-level `data` and `filters` have their own types** (`ColumnSettings`), so `$defs.columnSettings` holds
  a converted node for them and a `$ref` to the grid option for the rest. Their `x-handsontable` keeps the option's
  levels and plugin but the column type's `runtimeTypes`: the grid `data` takes no function, a column `data` does.
- **`pluginDisabled` is for a dependent option only** (`filterValueComparator` under `filters`): an option whose
  plugin is switched by another documented option of the same plugin. `undo` is UndoRedo's own switch although the
  plugin key is `undoRedo`, and `headerCheckbox` is CheckboxHeader's although the key is `checkboxHeader`, so a
  test on the plugin key alone reports both as off.
- **The registries are page-global**, so the registry and plugin checks run without `hot` and see whatever was
  registered when `validateSettings()` is called. `hot` adds only the data rows and the plugin state that an
  `updateSettings()` payload does not carry.
- **Never call a function from the settings, and never throw.** A `columns` or `cells` function may read external
  state, and an input may be a Proxy or carry a throwing getter: every read goes through `readProperty()`, and the
  last-resort `catch` turns anything else into one `invalidSettings` problem.
- **`getSettings()` must pass.** The grid writes `instance` and `_`-prefixed keys on its own settings object, and
  `metaSchema.ts` has `@private` and bookkeeping keys. All of them are accepted without a check, except
  `__proto__`. The generated module exports those keys and the built-in plugin keys as `internals`, next to the
  schema and not inside it, so the published schema names no private option.
- **The generator reads `metaSchema.ts` through the TypeScript parser, and fails rather than guess.** A key without
  `@memberof Options#` and `@configScope` (and without `@private` or a leading `_`) fails the build, so an option
  cannot slip in unchecked. The parser reads a tag wrapped onto two lines whole; `scripts/utils/option-levels.js`
  (the docs matrix) reads tags with a regular expression, so the generator also fails when the two disagree on an
  option's levels.
- **A plugin's switch can be `@category Core`** (`moveCells`, `selectionHandles`, `dataProvider`, `fillHandle`).
  The generator maps such an option to the plugin whose `PLUGIN_KEY`, or `const SETTING_KEY` (Autofill's
  `fillHandle`), names it, so `pluginNotRegistered` covers it on `handsontable/base`.
- **Two problem codes are warnings** (`unknownDataProperty`, `pluginDisabled`): each is a guess about intent, so it
  is listed with `severity: 'warning'` and does not make the settings invalid. Every other code is an `error`.
  `SettingsProblemCode` ends with `(string & {})`, because a minor release can add a code.
- **Only `dataSchema` widens TypeScript's `object` to take an array** (`OBJECT_OR_ARRAY_OPTIONS`). TS `object` takes
  arrays, but for `hiddenColumns` or `copyPaste` an array is a mistake.
- **The generated file's name has a dot in it**, and `scripts/swc-transpile.mjs` used to leave any specifier with an
  extension-like suffix alone, so the ES build imported `./schema.generated` with no `.mjs` and failed in Node, webpack
  and rspack, and esbuild loaded the CommonJS copy into an ES graph (every option then read as unknown). The
  transpiler now adds the extension whenever a source file with that dotted name exists. Types cannot see this; the
  runtime import step of `scripts/verify-esm-consumer-types.mjs` loads the entry point both ways and fails on it.
- **Built-in plugin keys are not options.** Only third-party plugins' `PLUGIN_KEY` and `SETTING_KEYS` are accepted
  as known keys; the built-in ones are listed in the generated `internals.builtInPlugins`, because `undoRedo` and
  `autofill` are keys that do nothing (the options are `undo` and `fillHandle`).
- **`anyOf` picks the branch with the fewest problems.** `data` is an array of arrays or an array of objects, and
  reporting the first branch's problems turned one bad row into one problem per good row. Problems are appended in a
  loop, never `push(...problems)`, which overflows the stack on a long array.
- **A value that holds a class instance (`runtimeTypes: ['object']`) matches only a non-plain object.** A plain
  object or an array goes through the JSON branches, or `theme: []` and a malformed `filters.availableConditions`
  pass unchecked.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern=settingsSchema` runs the behavior
  (`validateSettings.unit.js`, `validateSettingsBase.unit.js` for a page with `handsontable/base` only), the coverage of
  every option, hook and default (`schemaCoverage.unit.js`), and every JavaScript example of the docs guides
  (`docsExamples.unit.js`).
- `docsExamples.unit.js` runs each example with a `Handsontable` that records its settings. A problem it reports is a
  false positive of the validator or a broken example; fix the one that is wrong. An example that binds a missing
  property on purpose goes in its `EXPECTED_PROBLEMS` with the reason. A docs-only pull request does not route the
  Unit job, so a new example that trips it surfaces on the next core run.
- `settingsSchema.types.ts` pins the public types; `.config/emitted-types/entry-points.ts` pins the subpath under
  node16, nodenext and bundler resolution.

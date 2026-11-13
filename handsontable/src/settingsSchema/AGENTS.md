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
  checkout until one of those has run. Never commit it and never edit it. A run takes about a second (one TypeScript
  program over the settings types), so it exits early while `node_modules/.cache/settings-schema.stamp` is newer than
  every file and directory under `src/` and the generator's own inputs; delete the stamp to force a run.
- It reads two sources and owns neither. `metaSchema.ts` decides **which** options exist and their levels
  (`@configScope`), plugin (`@category`) and `@since`. `GridSettings`, `ColumnSettings` and `CellMeta` decide the
  **value types**, through the TypeScript compiler API, because the JSDoc `@type` has no enums. An option the types
  do not declare falls back to its JSDoc `@type`. A new option needs no change here, but one the types do not
  declare gets only the coarse JSDoc type, and `settingsTypesCoverage.unit.js` fails: declare it in `GridSettings`
  (or `CellMeta`). None falls back as of 19.0 (it was 10).
- **Core must not import this module**, and neither may anything core imports. The schema is about 100 KB of JSON
  (the subpath bundles to about 80 KB minified, 18 KB gzipped), and the main UMD bundles must not carry it (the
  CDN file below ships it). Nothing validates settings on its own: `new Handsontable()` and `updateSettings()` never
  call `validateSettings()`.
- **There is a second build of this module, the CDN file `dist/handsontable.settings-schema.js` (and `.min.js`).** It
  is built by `build:settings-schema-umd` and `build:settings-schema-umd.min` from `src/settingsSchema.ts` (configs
  `.config/settings-schema-umd-*.js`), as the global `HandsontableSettingsSchema`. It must read the registries of the
  `Handsontable` the page already loaded: a bundle that inlines the core registries reads its own empty copy and
  reports every `type` and plugin option. So **every registry read goes through `registries.ts`** (`hasCellType`,
  `hasEditor`, `hasRenderer`, `hasValidator`, `hasPlugin`, `getPlugin`, `getPluginsNames`, `getHooks`), and no other
  module here imports a registry or the hook registry (`core/hooks`; `core/hooks/constants` is plain data and is
  fine). Two build settings swap the source. An alias maps `registries.ts` to `registries.umd.ts`, and an external
  maps `./pageHandsontable` (the one import of `registries.umd.ts`) to the global `Handsontable`, or to the
  module an AMD or CommonJS loader resolves for `handsontable`, like the theme files. Without the external the file
  throws at load on a page whose loader keeps `Handsontable` out of the global, because the bundle registers through
  `define` there. The adapter reads the live registries through `Handsontable.hooks` and the private
  `Handsontable._registries` in `src/index.ts`: the public `get*` functions throw for an unknown name, and the
  `plugins` namespace is a snapshot taken at load, so neither answers "is it registered now". A new registry read
  needs an export in both adapters and an entry in the bridge. `registries.unit.js` pins the boundary (a direct
  registry import fails it), the same export names in the two adapters, and the bridge against the real registries.
  `tests/e2e/settings-schema-umd.spec.ts` pins the built file in a real browser on the plain and the minified bundle,
  on a script-tag page and on an AMD page, and that none of the four main bundles carries the schema. The AMD external
  is the module `Handsontable` (the name the bundle defines itself under), so a page needs no `map`; the fake loader
  of `settings-schema-amd.html` matches ids exactly like RequireJS. A schema file next to a bundle that predates
  `_registries` fails when it loads, with a message that names the load order and the version: `schema.ts` calls
  `getHooks()` then, and a throw from a later call would end in `validateSettings()`'s catch-all as one
  `invalidSettings` problem for every call. A bundle of another version that has the bridge is not detected: the file
  reads that page's registries against its own schema, `REMOVED_HOOKS` and `DEPRECATED_HOOKS`. `registries.umd.ts` and
  `pageHandsontable.ts` are bundled from `src/` by the CDN build only, so `swc-transpile.mjs` and
  `tsconfig.build-types.json` leave them out of the package.
- The hooks are not generated. `schema.ts` adds one property per hook from the hook registry when the module
  loads, and `validateSettings()` asks `Hooks#isRegistered()` at call time, so a hook registered later passes too.

## The traps

- **A type that names a class must be listed in `RUNTIME_OBJECT_TYPES`, or it bloats the schema.** The converter
  expands every property it can read, so `theme: ThemeBuilder | ... | string` put the class's `#private` fields into
  the schema, and a `ThemeParams` member added every icon and token: 102 KB for one option, over 130 KB in all
  against 65 KB for the rest. `ThemeBuilder` is listed (a class instance, `runtimeTypes`), and `theme` takes `object` for a plain config.
  A new option typed with a class or another wide type needs the same, and `settingsTypesCoverage.unit.js` fails when
  any option node passes 3000 characters.
- **A value JSON cannot hold goes in `x-handsontable.runtimeTypes`, never in `type`.** A function, a `RegExp`, a DOM
  element or a class instance is not a JSON type, so a JSON validator must reject it in a JSON document, while
  `validateSettings()` accepts it at runtime. A node with no JSON form at all is `not: {}` plus `runtimeTypes`.
- **A default must pass its own entry.** An option whose `metaSchema.ts` default is `null` gets `null` added to its
  type even when the TS type omits it (`colHeaders`). `schemaCoverage.unit.js` checks every default.
- **Every documented option of a plugin accepts `null`, by one generator rule and not per option.** `buildNode` in
  the generator adds `null` when the option has a plugin and an entry in `metaSchema.ts`, the switches and the
  sub-options (`filterValueComparator`, `parsePastedValue`) alike: an app's own state can hold `null` before the
  configuration loads (`useState(null)`, which the wrappers pass through), `checkPlugin()` already skips `null` for
  every plugin option, and a runtime probe of every such option found none that throws or warns on `null`. The public
  types stay as they are: widening `GridSettings.pagination` would break readers of `getSettings()`. A cell-meta-only
  key (`comment`) has no entry and keeps its type. **`null` is not one thing at runtime.** A plugin that is on by
  default and checks `!!settings[key]` (`copyPaste`, `fillHandle`, `undo`, `dragToScroll`) turns off on `null`, at
  init and after `updateSettings()`, as it does on `false`. `autoColumnSize` and `importFile` check `!== false`, so
  `null` leaves them on. The validator accepts both without a hint, and the guide says so. `schemaCoverage.unit.js`
  pins the rule for every such option.
- **A type narrower than what the plugin accepts is a false positive, so keep the two together.**
  `DataProviderConfig.rowId` is `RowIdKey` (`utils/rowId.ts`), the type of the grid-level `rowId`: a string path or a
  function of the source row. Its validator in the plugin's `constants.ts` accepts any function. Narrowing either
  side flags the function form the guide shows, and typing the function's parameter `unknown` rejects a function that
  declares its row type (contravariance).
- **Levels come from `@configScope` and nothing else.** A wrong tag shows up as a `wrongLevel` false positive on a
  documented configuration. Fix the tag (and re-run `generate:option-levels`), not the validator.
- **The column-level `data` and `filters` have their own types** (`ColumnSettings`), so `$defs.columnSettings` holds
  a converted node for them and a `$ref` to the grid option for the rest. Their `x-handsontable` keeps the option's
  levels and plugin but the column type's `runtimeTypes`: the grid `data` takes no function, a column `data` does.
- **`pluginDisabled` is for a dependent option only** (`filterValueComparator` under `filters`): an option whose
  plugin is switched by another documented option of the same plugin. `undo` is UndoRedo's own switch although the
  plugin key is `undoRedo`, and `headerCheckbox` is CheckboxHeader's although the key is `checkboxHeader`, so a
  test on the plugin key alone reports both as off.
- **An editor a plugin ships is accepted from the plugin's static `EDITORS` list.** The editor registry
  learns such an alias only when the plugin's first instance is built (FormulaBuilder registers `formula` in
  its constructor, because importing the plugin registry must register plugins only, as the `registerAll*`
  registry tests pin), so a `validateSettings()` call before any grid exists would otherwise report
  `unknownEditor` for a documented configuration. `isEditorProvidedByPlugin()` reads `EDITORS` off every
  registered plugin class.
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
- **A settings object is closed per option, never by default.** `CLOSED_OPTIONS` in the generator lists the plugin
  options whose object takes no key but the ones the schema lists. Their object branch gets
  `additionalProperties: false`, and `validateSettings()` reports each other own key as `unknownOption` at its nested
  path (`filters.serchMode`) with a "did you mean" hint. Add an option only when its type lists every key the plugin
  reads. The generator fails on an index signature. `schemaCoverage.unit.js` compares each closed list with the
  plugin's `DEFAULT_SETTINGS` (`dropdownMenu` has none, so its three keys are written into that test), pins the exact
  set of closed options, and checks the column-level `filters`. The docs guide lists the same options by hand, and
  nothing checks it, so update both. Nested objects such as `filters.availableConditions` stay open. A class instance
  is not checked, so a `dataProvider` object with fields of its own passes.
- **`pagination` and `dropdownMenu` take their key list from an interface the plugin exports.** `GridSettings`
  declares them as `boolean | object` and `boolean | object | string[]`, so the generator reads `PaginationSettings`
  and `DropdownMenuSettings` (`CLOSED_OPTIONS` names the file and the interface). Narrowing the public type instead
  would be a breaking change for a typed object literal. The interface also types the values, so a type that is too
  narrow flags a valid configuration (`items` takes strings and objects mixed, and `uiContainer` takes `null`). A key
  a plugin starts to read goes in its interface in the same change, or a valid configuration is flagged.
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
- **A `columns[].data` key is read the way `DataMap#get` reads it**: a plain key only when the row owns it (a
  prototype getter renders an empty cell), while the steps of a dotted path use plain property access.
- **One bad value, one problem.** The registry, plugin, and data checks of a key run only when its type check
  passed, so `{ filterValueComparator: 42 }` is not also reported as `pluginDisabled`.
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
  property on purpose goes in its `EXPECTED_PROBLEMS` with the reason. The Unit filter in `checks.yml` names the
  JavaScript guide examples, so a docs-only pull request that changes one runs this file.
- `settingsSchema.types.ts` pins the public types; `.config/emitted-types/entry-points.ts` pins the subpath under
  node16, nodenext and bundler resolution.

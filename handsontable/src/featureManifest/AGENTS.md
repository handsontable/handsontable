# Feature manifest – what Handsontable is made of, and what each part needs

Every Handsontable feature a license key can name, and every module a feature needs, is described in a small
JSON file next to its code. A build step checks the files against the source and produces:

- `dist/manifest.json`, published in the npm package (`handsontable/dist/manifest.json`) and on jsDelivr. The
  license portal reads it to build license keys ("Filters needs Checkbox").
- the committed `feature.generated.ts` modules the plugins read their `PLUGIN_DEPS` from. **`PLUGIN_DEPS` is
  never written by hand any more.**
- the committed `released-tokens.json`, the record that keeps an id from being removed or sold later.

Code: `scripts/utils/feature-manifest.js` (loader, checks, builders; CommonJS so Jest and node both load it) and
`scripts/generate-feature-manifest.mjs` (the CLI). Tests: `test/__tests__/featureManifest.unit.js` (the sources
against the source code, and the checks themselves) and `__tests__/registries.unit.js` (the sources against the
runtime registries).

## Adding a module: the manifest entry is part of the change

**A new plugin, cell type, editor, renderer, or validator is not complete without its manifest entry.** The
Jest suite fails until it has one (`needs exactly one "plugin" entry for "<Name>"`).

| You add | Add an entry to | `id` | `licensing` |
|---|---|---|---|
| a plugin `src/plugins/<name>/` | `src/plugins/<name>/feature.json` | `feat:<plugin_key_in_snake_case>` | `token` |
| a cell type | `src/cellTypes/features.json` | `cell:<type_in_snake_case>` | `token` |
| an editor, renderer, or validator | `src/editors/`, `src/renderers/`, or `src/validators/` `features.json` | `editor:…`, `renderer:…`, `validator:…` | `none` |
| an XLSX sub-feature a key can switch | `src/utils/xlsxEngine/features.json` | `xlsx:<name>` | `token` or `core` |

Then run `npm run generate:feature-manifest --prefix handsontable` and commit what it writes (the record in
`released-tokens.json`, and a `feature.generated.ts` if the plugin's dependencies are checked at init).

A plugin entry looks like this (`src/plugins/filters/feature.json`):

```json
{
  "schemaVersion": 1,
  "capabilities": [
    {
      "id": "feat:filters",
      "kind": "plugin",
      "module": "Filters",
      "name": "Filters",
      "description": "Filters rows by condition or by value from the column menu.",
      "status": "stable",
      "licensing": "token",
      "gate": "enable",
      "requires": { "allOf": ["feat:dropdown_menu", "feat:hidden_rows", "cell:checkbox"] },
      "enforceAtInit": true
    }
  ]
}
```

## Plugin dependencies: declare them in `feature.json`, never in the class

`requires.allOf` lists what the feature needs to work. It feeds two things:

1. **The license closure.** A key that lists an entry also lists every token it requires (`implies` in
   `dist/manifest.json`).
2. **`PLUGIN_DEPS`, when `"enforceAtInit": true`.** The generator turns `requires.allOf` into the
   `'type:Name'` strings `initializePlugins()` checks (`plugins/base/base.ts`; `plugin:DropdownMenu`,
   `cell-type:checkbox`) and writes them
   to `feature.generated.ts` in the plugin's folder. The class returns a copy:

   ```ts
   import { PLUGIN_DEPS } from './feature.generated';

   static get PLUGIN_DEPS() {
     return [...PLUGIN_DEPS];
   }
   ```

   `new Handsontable()` throws when such a module is not registered, so `enforceAtInit` makes a dependency hard
   for modular users. The check runs for every **registered** plugin, enabled or not. **Turning it on for a
   released plugin is a breaking change** (a user who registered the plugin without the dependency starts
   getting a throw): it needs a migration-guide step and a breaking changelog entry. Loading → Dialog went
   that way in 19.0, because Loading did nothing at all without Dialog. For a plugin no release has shipped
   yet (FormulaBuilder, CheckboxHeader in 19.0) it is free, so turn it on whenever the plugin cannot work
   without the dependency. The custom-build service adds `PLUGIN_DEPS` to a build, so a link left out of it
   can produce a build that silently lacks the dependency.

   No `feature.generated.ts` in a plugin folder does not mean a dependency was forgotten: most plugins need
   none. To find one, look for `getPlugin('X')` calls the plugin cannot work without.

To change a plugin's dependencies, edit its `feature.json` and run `generate:feature-manifest`. Hand-editing
`feature.generated.ts` or writing a `PLUGIN_DEPS` array in the class fails the Jest suite. The order of
`requires.allOf` is the order of `PLUGIN_DEPS` and of the error message.

The strings must stay byte-identical: the custom-build service reads `PLUGIN_DEPS` from each plugin class. Each
plugin with `enforceAtInit` has a `__tests__/pluginDependencies.unit.ts` that pins its strings and the error.

List only what the feature cannot work without. Most plugins work alongside many others, so "works with" is not
recorded; a link that is really a need belongs in `requires` (`xlsx:formulas` requires `feat:formulas`, because
the import and the export read formulas through that plugin).

## Fields

Every source file has two top-level keys, both required: `"schemaVersion": 1` and `capabilities`, the list of
entries. Each entry takes these fields:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | The token. Must pass the license-key rule `^[a-z][a-z0-9_]*(:[a-z0-9_]+(\.[a-z0-9_]+)*)?$` and start with the namespace of its kind. A new registry entry's id is that namespace plus `module` in snake_case (`feat:dropdown_menu`, `cell:intl_date`), so a typo cannot become permanent; a recorded id keeps its name when the module is renamed. A sub-feature has a namespace of its own (`xlsx:`). `<namespace>:all` is reserved. |
| `kind` | yes | `plugin`, `cell_type`, `editor`, `renderer`, `validator`, `sub_feature`, or `core_area` |
| `module` | registry kinds | The registered name: `Filters`, `checkbox`, `intl-date`. Checked against the source constant and the runtime registry. |
| `plugins` | `sub_feature` | The plugins whose behavior the sub-feature changes. |
| `name`, `description` | yes | English text shown where keys are built. Not translated. Never prices. |
| `since` | no | The release that first ships the id. Default `19.0.0` (`FIRST_RELEASE`); a feature added later declares its own. |
| `status` | yes | `stable`, or `planned` (listed but not issued yet, not recorded as released, may still be renamed). |
| `licensing` | yes | `token` (a key must list it), `core` (always granted), `none` (never in a key). Fixed by kind, see below. |
| `gate` | when `token` | How Handsontable will check it: `enable` (plugin turns on), `call` (an always-on plugin, checked in its methods), `degrade` (sub-feature left out of the result), `report` (listed, keeps working). |
| `requires` | no | `{ "allOf": [...], "anyOf": [...] }`. `anyOf` means at least one, which the key builder cannot choose on its own. |
| `enforceAtInit` | plugins | `true` turns `requires.allOf` into `PLUGIN_DEPS` (see above), so it needs a non-empty `allOf`. |
| `packages` | no | npm packages the user supplies (`hyperformula`, `hyperformula-ui`). |

Unknown fields fail the check, so the format cannot drift.

## Format versions

The source files and `dist/manifest.json` each carry a `schemaVersion`. The two numbers are separate
(`SOURCE_SCHEMA_VERSION` and `SCHEMA_VERSION` in `scripts/utils/feature-manifest.js`), so either format can change
without the other.

- **`dist/manifest.json` is public** (npm, jsDelivr), and the license portal reads it. A reader ignores fields it
  does not know, and stops on a version it does not know. A new field or a new capability keeps the version.
  Removing or renaming a field, changing what a value means, or adding a `kind` or `licensing` value raises it.
- **The source files** are read only by the generator, which accepts only the current version. Raising it
  rewrites every source file in the same commit.
- `released-tokens.json` has no version: only the generator reads it, and it changes in the same commit.

## The licensing rule

`licensing` follows the kind, not a per-feature choice:

- every plugin: `token`, except `TouchScroll` and `MultipleSelectionHandles` (`none`: private, no option, on by
  device);
- every cell type: `token`, except `text` (`core`). Handsontable does not check cell types yet; a key grants all
  of them with `cell:all`;
- editors, renderers, validators: `none` – licensed through their cell type;
- XLSX sub-features: decided per entry (`xlsx:import_report` is `core`).

## Rules that keep issued keys working

A key carries tokens for years. So:

- **A token is never removed or renamed.** A sub-feature can take a new id with the old one kept beside it. A
  registry entry cannot (one module, one entry), so a plugin, cell type, editor, renderer, or validator renamed
  after its id was recorded keeps that id: the "id is made from `module`" rule applies only to an id the record
  does not hold yet.
- **An id released as `core` or `none` never becomes `token`.** A restricted key issued before would not list
  it, and the feature would turn off for that customer on upgrade. `token` → `core` is allowed, and the id
  then stays both: never removable, never sellable again.
- **A `core` entry never requires a `token` entry**, directly or through other entries.
- **A released id never goes back to `planned`, and a stable entry never requires a planned one.** A planned
  id may still be renamed, so it must not reach a key through `implies`.

`released-tokens.json` lists every stable id with every `licensing` value it has had (`["core", "token"]` after
a `token` → `core` move). It only grows. Two checks hold it:

- `generate:feature-manifest` (and the Jest suite) refuse a source change the record forbids.
- CI ("Check that the released feature ids only grow", in the `test presence` job of `checks.yml`) compares
  the record with the base branch's copy (`--check-base`), because one pull request can edit the manifest and
  the record together. So an id is "released" from the moment it is merged (`next` builds publish the
  manifest too), and not before.

**To rename or drop an id that never reached the base branch**, delete its line from the record, then run
`generate:feature-manifest`. The base check allows that and nothing else. To run it locally:
`git show origin/develop:handsontable/src/featureManifest/released-tokens.json > /tmp/base.json`, then
`node scripts/generate-feature-manifest.mjs --check-base /tmp/base.json` (in `handsontable/`). A missing file
on the base branch means `{}`.

## Traps

- **The manifest does not say whether a plugin is on by default, on purpose.** That fact already lives in
  `dataMap/metaManager/metaSchema.ts` (the option's default) and in the plugin's `isEnabled()` (AutoColumnSize and
  ImportFile turn on unless the option is `false`; ExportFile, ViewState, and CheckboxHeader are always on and use
  `gate: "call"`). Do not copy it into an entry. A plugin that is on by default still needs its token: a key that
  leaves it out will turn it off once Handsontable checks keys.
- **Every registry folder needs exactly one entry**, and every entry needs a folder. A folder that registers
  nothing goes in `REGISTRIES[].skip` in `scripts/utils/feature-manifest.js`, with the reason (`base`,
  `editors/utils`, `maxLengthValidator`, `regExpValidator`). The checkbox validator is registered but the checkbox
  cell type does not use it (opt-in `validator: 'checkbox'`), so it is not one of the parts `cell:checkbox` requires.
- **A cell type's `requires.allOf` lists exactly the editor, renderer, and validator its source imports.** The
  Jest suite compares them.
- **`build:feature-manifest` never writes into `src/`.** It fails when a committed output is stale. Only
  `generate:feature-manifest` (`--write`) rewrites them, and it deletes a `feature.generated.ts` that is no longer
  needed.
- **Only plugins with `enforceAtInit: true` get a `feature.generated.ts`.** The license check in Handsontable
  (a later phase) will add more to the generated modules; nothing reads license data at runtime yet.
- **`dist/manifest.json` takes its `version` from `package.json`** and has no timestamp: the same sources give
  the same bytes.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern=featureManifest`
- `npm run build:feature-manifest --prefix handsontable` runs every check without Jest.

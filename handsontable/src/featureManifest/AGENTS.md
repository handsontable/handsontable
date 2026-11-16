# Feature manifest – what Handsontable is made of, and what each part needs

Every Handsontable feature a license key can name, and every module a feature needs, is described in a small
JSON file next to its code. A build step checks the files against the source and produces:

- `dist/manifest.json`, published in the npm package (`handsontable/dist/manifest.json`) and on jsDelivr. The
  license portal reads it for the tiers and the features each tier includes.
- the committed `feature.generated.ts` modules the plugins read their `PLUGIN_DEPS` and `LICENSE` from. **Neither
  is ever written by hand.**
- the committed `src/utils/xlsxEngine/licenseCapabilities.generated.ts`, the XLSX token lists the runtime license
  check reads (`XLSX_CAPABILITY_IDS`, `IMPORT_FILE_CAPABILITY_IDS`, `EXPORT_FILE_CAPABILITY_IDS`, `XLSX_FLAG_BY_ID`,
  `XLSX_TIERS_BY_ID`), made from the `token` entries of `src/utils/xlsxEngine/features.json` with a `call` or
  `degrade` gate.
  `licenseCapabilities.ts` re-exports them; never write those lists by hand.
- the committed `released-tokens.json`, the record that keeps an id from being removed.
- the feature-to-tier matrix in the license key guide
  (`docs/content/guides/getting-started/license-key/license-key.md`, between the `license-tiers` markers). The path
  starts with `../`, because every output path is relative to `handsontable/`. Two tests hold it: the sync test in
  `test/__tests__/featureManifest.unit.js`, and `scripts/__tests__/license-tiers-matrix.test.mjs` in the root
  `test:tooling`, which runs on a pull request that changes only the page. A checkout without the `docs/`
  directory (a sparse one) leaves the guide out, so the core still builds there; with `docs/` present and the
  guide missing, the generator throws.

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
| an XLSX sub-feature a tier can switch | `src/utils/xlsxEngine/features.json` | `xlsx:<name>` | `token` |

Every `token` entry also lists the tiers that include it (`"tiers": ["standard", "professional"]`, see "Tiers"
below).

Then run `npm run generate:feature-manifest --prefix handsontable` and commit what it writes (the record in
`released-tokens.json`, the plugin's `feature.generated.ts`, the tier matrix of the license key guide, and, for an
XLSX sub-feature, the generated module `licenseCapabilities.generated.ts`). A plugin with `licensing: "token"` also
returns the generated `LICENSE` from its class, or the Jest suite fails (see "The license check" below). A new `xlsx:<name>` token drives the
`XlsxEntitlement` flag named after its suffix in camelCase (`xlsx:number_formats` → `numberFormats`), so add that
key to the interface in `src/utils/xlsxEngine/xlsxEntitlement.ts` as well; `xlsxEntitlement.unit.js` fails until
the two match.

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
      "tiers": ["standard", "professional"],
      "requires": { "allOf": ["feat:dropdown_menu", "feat:hidden_rows", "cell:checkbox"] },
      "enforceAtInit": true
    }
  ]
}
```

## Plugin dependencies: declare them in `feature.json`, never in the class

`requires.allOf` lists what the feature needs to work. It feeds two things:

1. **The tier closure.** A tier that includes an entry must include every sold entry it requires (the generator
   fails otherwise, see "Tiers"). `dist/manifest.json` publishes `requires` and `tiers` only: the closure (`computeImplies()`)
   is a build check, never published and never read at runtime.
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

   No `PLUGIN_DEPS` in a plugin's `feature.generated.ts` does not mean a dependency was forgotten: most plugins
   need none. To find one, look for `getPlugin('X')` calls the plugin cannot work without.

To change a plugin's dependencies, edit its `feature.json` and run `generate:feature-manifest`. Hand-editing
`feature.generated.ts` or writing a `PLUGIN_DEPS` array in the class fails the Jest suite. The order of
`requires.allOf` is the order of `PLUGIN_DEPS` and of the error message.

The strings must stay byte-identical: the custom-build service reads `PLUGIN_DEPS` from each plugin class. Each
plugin with `enforceAtInit` has a `__tests__/pluginDependencies.unit.ts` that pins its strings and the error.

List only what the feature cannot work without. Most plugins work alongside many others, so "works with" is not
recorded; a link that is really a need belongs in `requires` (`xlsx:formulas` requires `feat:formulas`, because
the import and the export read formulas through that plugin).

## The license check: `LICENSE` is generated too

Every plugin with `licensing: "token"` gets a `LICENSE` export in its `feature.generated.ts`: `{ capability, name,
gate, tiers }` – the id, the display name the license message prints, the `gate`, and the tiers that include it. The
class returns it, the way it returns `PLUGIN_DEPS`:

```ts
import { LICENSE } from './feature.generated';

static get LICENSE() {
  return LICENSE;
}
```

Handsontable reads it at run time (`src/utils/licenseCapabilities/`, rules in
`../utils/entitlementLicenseKey/AGENTS.md`): a key that names tiers turns on the plugins whose `LICENSE.tiers` list one
of them. `BasePlugin` keeps any other `gate: "enable"` plugin off, and a `gate: "call"` plugin checks its id in its own
public methods. A key that names no tier turns on everything. The tiers are read from the REGISTERED plugin classes, so
the manifest is the only place an assignment is declared. Two tests hold it: `__tests__/registries.unit.js` compares every
class's `LICENSE` with what the generator builds (`toPluginLicense()`), and `test/__tests__/featureManifest.unit.js`
fails a plugin that writes the object in the class instead of importing it. A plugin with `licensing: "none"` has no
`LICENSE` and is never checked. `gate: "call"` is for a plugin that is on in every grid; a check at enable would report
it on every grid, so its public methods check instead (`assertLicensedCall()` in `utils/licenseNotification.ts`).

## Fields

Every source file has two top-level keys, both required: `"schemaVersion": 1` and `capabilities`, the list of
entries. Each entry takes these fields:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | The token. Must pass the license-key rule `^[a-z][a-z0-9_]*(:[a-z0-9_]+(\.[a-z0-9_]+)*)?$` and start with the namespace of its kind. A new registry entry's id is that namespace plus `module` in snake_case (`feat:dropdown_menu`, `cell:intl_date`), so a typo cannot become permanent; a recorded id keeps its name when the module is renamed. A sub-feature has a namespace of its own (`xlsx:`). `<namespace>:all` is reserved, because keys issued before tiers used it, and so is the `tier` namespace, which holds the tier tokens. |
| `kind` | yes | `plugin`, `cell_type`, `editor`, `renderer`, `validator`, `sub_feature`, or `core_area` |
| `module` | registry kinds | The registered name: `Filters`, `checkbox`, `intl-date`. Checked against the source constant and the runtime registry. |
| `plugins` | `sub_feature` | The plugins whose behavior the sub-feature changes. |
| `name`, `description` | yes | English text shown in the tier matrix of the license key guide and in `dist/manifest.json`. Not translated. Never prices. |
| `since` | no | The release that first ships the id. Default `19.0.0` (`FIRST_RELEASE`); a feature added later declares its own. |
| `status` | yes | `stable`, or `planned` (listed but not issued yet, not recorded as released, may still be renamed). |
| `licensing` | yes | `token` (sold in one or more tiers), `none` (never in a tier). Fixed by kind, see below. |
| `gate` | when `token` | How Handsontable checks it: `enable` (plugin turns on), `call` (an always-on plugin, checked in its methods), `degrade` (sub-feature left out of the result), `report` (listed, keeps working, never turned off). |
| `tiers` | when `token` | The tiers that include it, each declared in `tiers.json`, none listed twice. An entry with `none` lists no tiers. |
| `requires` | no | `{ "allOf": [...], "anyOf": [...] }`. `anyOf` means at least one: a tier that includes the entry includes at least one of them. |
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
  It is `2` since keys name tiers: version 1 published `keyFlag` and `implies` and no `tiers`, and `next` builds
  carried it, so a reader written for version 1 must stop on this one rather than read fields that are gone.
- **The source files** are read only by the generator, which accepts only the current version. Raising it
  rewrites every source file in the same commit.
- `released-tokens.json` has no version: only the generator reads it, and it changes in the same commit.

## The licensing rule

`licensing` follows the kind, not a per-feature choice:

- every plugin: `token`, except `TouchScroll` and `MultipleSelectionHandles` (`none`: private, no option, on by
  device);
- every cell type, the `grid` core area ("Data grid"), and every XLSX sub-feature: `token`. Cell types, `grid`, and
  `xlsx:import_report` take `gate: "report"`: they are sold in every tier and listed, and Handsontable never turns
  them off;
- editors, renderers, validators: `none` – licensed through their cell type.

`core` is no longer a `licensing` value. `released-tokens.json` keeps it for the ids that held it (`RECORDED_LICENSING`),
because a record never loses a value.

## Tiers

- **`tiers.json` holds the tier names**, in the order the tier matrix and `dist/manifest.json` list them. A name must
  fit the key token `tier:<name>` (`^[a-z][a-z0-9_]*$`), and no name is listed twice.
- **Every sold entry declares `tiers`.** The generator refuses an unknown name, a repeated one, and `tiers` on an
  entry with `licensing: "none"`.
- **A tier includes what its features require.** For each tier of an entry, every sold entry its `requires.allOf`
  reaches (the `implies` closure) and at least one member of its `requires.anyOf` must list that tier too.
- **The `tier` namespace is reserved** for tier tokens: no entry id may start with `tier:`.
- **A tier name, once merged, is never renamed or removed.** The license portal reads the top-level `tiers` of each
  published build (the `experimental` tag included) and refuses a build that lacks a tier it sells, and keys that
  name the tier are already issued. Add a tier; do not rename one. `released-tokens.json` records each tier as its
  key token (`"tier:standard": ["tier"]`): `checkReleased()` refuses sources that lack a recorded tier, and
  `--check-base` refuses a record that drops one, the same way both protect a sold feature id.
- **Public text says "tier"**, never "plan": the key token is `tier:<name>`, the manifest field is `tiers`, and
  "plan" already names a support product.
- **`dist/manifest.json`** carries `tiers` at the top level and per capability, and no `keyFlag` (the
  `listed-capabilities` flag is gone).
- **Moving a feature between tiers is a source edit**: change its `tiers`, run `generate:feature-manifest`, commit the
  regenerated `feature.generated.ts` (or `licenseCapabilities.generated.ts`) and the license key guide. No code changes.
- **The library never compares tiers with each other.** No tier is "higher"; a key turns on the union of the tiers it
  names, and code never branches on a specific tier name. A tier this version does not know includes nothing.

## Rules that keep issued keys working

A key carries tokens for years. So:

- **A token is never removed or renamed.** A sub-feature can take a new id with the old one kept beside it. A
  registry entry cannot (one module, one entry), so a plugin, cell type, editor, renderer, or validator renamed
  after its id was recorded keeps that id: the "id is made from `module`" rule applies only to an id the record
  does not hold yet.
- **An id released as `core` or `none` may become `token`.** A key names tiers, and the library ignores the feature
  ids a key lists, so no issued key loses a feature that way.
- **A released id never goes back to `planned`, and a stable entry never requires a planned one.** A planned
  id may still be renamed, so a released feature must not depend on it.

`released-tokens.json` lists every stable id with every `licensing` value it has had (`["core", "token"]` for an id
that was `core` before tiers). It only grows. Two checks hold it:

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
  `gate: "call"`). Do not copy it into an entry. A plugin that is on by default still needs its tiers: a key whose
  tiers leave it out turns it off.
- **Every registry folder needs exactly one entry**, and every entry needs a folder. A folder that registers
  nothing goes in `REGISTRIES[].skip` in `scripts/utils/feature-manifest.js`, with the reason (`base`,
  `editors/utils`, `maxLengthValidator`, `regExpValidator`). The checkbox validator is registered but the checkbox
  cell type does not use it (opt-in `validator: 'checkbox'`), so it is not one of the parts `cell:checkbox` requires.
- **A cell type's `requires.allOf` lists exactly the editor, renderer, and validator its source imports.** The
  Jest suite compares them.
- **`build:feature-manifest` never writes into `src/`.** It fails when a committed output is stale. Only
  `generate:feature-manifest` (`--write`) rewrites them, and it deletes a `feature.generated.ts` that is no longer
  needed. The XLSX license module, `released-tokens.json`, and the guide are always generated, so they are never
  deleted. `generate:feature-manifest` writes into `docs/` too (the guide), so commit that file with the sources.
- **A plugin gets a `feature.generated.ts` when it has `enforceAtInit: true` or `licensing: "token"`** (every
  plugin but the two unsold ones). The two exports are independent: most modules hold `LICENSE` only. The XLSX
  sub-feature ids and their tiers are read from their own module (`licenseCapabilities.generated.ts`).
- **`dist/manifest.json` takes its `version` from `package.json`** and has no timestamp: the same sources give
  the same bytes.

## Testing

- `npm run test:unit --prefix handsontable -- --testPathPattern=featureManifest`
- `npm run build:feature-manifest --prefix handsontable` runs every check without Jest.

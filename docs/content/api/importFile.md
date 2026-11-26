---
title: ImportFile
metaTitle: ImportFile | Handsontable DataGrid for JavaScript
permalink: /api/import-file
canonicalUrl: /api/import-file
searchCategory: API Reference
hotPlugin: false
editLink: false
id: k7xq2m4d
description: Use the ImportFile plugin with its API options, members, and methods to load an Excel workbook into your grid with the built-in engine, or an engine you provide.
react:
  id: r3vn8p1s
  metaTitle: ImportFile | Handsontable DataGrid for React
angular:
  id: w9zt5c6b
  metaTitle: ImportFile | Handsontable DataGrid for Angular
---

[[toc]]

See the [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md) guide for examples and configuration details. See the [Infer column types](@/guides/import-and-export/infer-column-types/infer-column-types.md) guide for examples and configuration details.

## Options

### importFile
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api importFile|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3413

:::

_importFile.importFile : boolean | object_

The `importFile` option configures the `ImportFile` plugin.

You can set the `importFile` option to one of the following:

| Setting     | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `undefined` | Use the `ImportFile` plugin with the default configuration          |
| `true`      | Use the `ImportFile` plugin with the default configuration          |
| `false`     | Disable the `ImportFile` plugin                                     |
| An object   | Enable the `ImportFile` plugin and modify the plugin options        |

If you set the `importFile` option to an object, you can configure the following options:

| Option    | Type     | Default | Description                                                                         |
| --------- | -------- | ------- | ----------------------------------------------------------------------------------- |
| `engines` | `Object` | –       | Optional. A map of format keys to engine modules. Pass `{ xlsx: ExcelJS }` to import through ExcelJS instead of the built-in engine. |

`false` disables the plugin. Any other value, including leaving the option out, enables it.

Read more:
- [Import from Excel](@/guides/accessories-and-menus/import-from-excel/import-from-excel.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// XLSX import with the built-in engine
importFile: true,

// or import XLSX through ExcelJS
import ExcelJS from 'exceljs';

importFile: {
  engines: { xlsx: ExcelJS },
},
```

## Members

### LICENSE

::: ask-about-api LICENSE|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L757

:::

_ImportFile.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L738

:::

_ImportFile.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L743

:::

_ImportFile.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L762

:::

_ImportFile.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.


## Methods

### convertToInferredTypes

::: ask-about-api convertToInferredTypes|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L900

:::

_importFile.convertToInferredTypes()_

Returns a copy of `data` with every value converted to what its column's inferred cell type
stores: a number for `numeric`, `YYYY-MM-DD` for `date`, `YYYY-MM-DDTHH:mm:ss` for
`intl-datetime`, `HH:mm:ss` for `time`, and a boolean for `checkbox`. A `Date` converts to its
local date and time. A value the column cannot read, such as a `Total` row, is kept as it is, so the
cell type's validator marks it. When the result found a header row, that row is left out.
`data` itself is not changed.

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes Import from file.



### destroy

::: ask-about-api destroy|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L969

:::

_importFile.destroy()_

Removes the instance-owned stylesheet installed by a previous import before the base plugin
teardown runs.



### disablePlugin

::: ask-about-api disablePlugin|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L832

:::

_importFile.disablePlugin()_

Disables the plugin functionality for this Handsontable instance and removes the stylesheet a
previous import installed, so `htImported-*` rules stop painting cells whose meta still carries
the class. Every import still reading is made stale too: the enabled check at apply time sees
only the state at the end of the read, so `importFile: false` and then `true` during a read let
that read apply.



### enablePlugin

::: ask-about-api enablePlugin|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L819

:::

_importFile.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### importFromArrayBuffer

::: ask-about-api importFromArrayBuffer|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L922

:::

_importFile.importFromArrayBuffer(format, buffer, [options]) ⇒ Promise&lt;ImportResult&gt;_

Reads a workbook from an `ArrayBuffer` (or a view onto one, such as a `Uint8Array`) and maps it
into an `ImportResult`. Applies the result to the grid unless `options.apply` is `false`
or a `beforeImport` hook returns `false`.

When a newer import that applies its result starts on the same instance before this one
finishes, this one is not applied and the returned promise rejects: the import started last
wins. An `apply: false` import neither cancels another import nor is cancelled by one. Turning
the plugin off (`importFile: false`) while the file is being read rejects the import too, even
when the plugin is turned back on before the read ends. So does a [Core#loadData](@/api/core.md#loaddata) call made
while the file is being read, for example a sheets bar switch: the result is not applied over
the data loaded in the meantime.

**Throws**:

- <code>Error</code> The returned promise rejects when the license key names tiers and none of them includes Import from file.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | The import format, e.g. `'xlsx'`. |
| buffer | `ArrayBuffer` <br/> `ArrayBufferView` | The file's bytes. |
| [options] | `ImportOptions` | `optional` Import options. |



### importFromBlob

::: ask-about-api importFromBlob|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L950

:::

_importFile.importFromBlob(format, blob, [options]) ⇒ Promise&lt;ImportResult&gt;_

Reads a workbook from a `Blob` (e.g. a `File` from an `<input type="file">`) and maps it into
an `ImportResult`. Applies the result to the grid unless `options.apply` is `false` or a
`beforeImport` hook returns `false`.

When a newer import that applies its result starts on the same instance before this one
finishes, this one is not applied and the returned promise rejects: the import started last
wins. An `apply: false` import neither cancels another import nor is cancelled by one. Turning
the plugin off (`importFile: false`) while the file is being read rejects the import too, even
when the plugin is turned back on before the read ends. So does a [Core#loadData](@/api/core.md#loaddata) call made
while the file is being read, for example a sheets bar switch: the result is not applied over
the data loaded in the meantime.

**Throws**:

- <code>Error</code> The returned promise rejects when the license key names tiers and none of them includes Import from file.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | The import format, e.g. `'xlsx'`. |
| blob | `Blob` | The file. |
| [options] | `ImportOptions` | `optional` Import options. |



### inferColumnTypes

::: ask-about-api inferColumnTypes|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L885

:::

_importFile.inferColumnTypes()_

Infers a cell type and format for every column of raw, untyped data: rows parsed from a CSV
file, pasted text split into cells, or values from an API. Works without an engine.

Returns `{ columns, headerRow }`. Each column is `{ settings, confidence, inputFormat, title,
stats }`. `settings` holds the column options (`type`, `numericFormat`, `dateFormat`,
`dateTimeFormat`, `timeFormat`, `source`, and `data` for object rows) and can be passed to
`columns` as it is.
`confidence` is the share of values the type reads, `inputFormat` is how the raw values were
written, `title` is the header (see the `headerRow` option), and `stats` is set with the `stats`
option. A column that no type reads with at least `minConfidence` falls back to `'text'`.

The result is deterministic: it reads `sampleSize` rows (the first ones, or with
`sampling: 'spread'` rows spaced evenly across the data) and settles an ambiguous column
(`1.234`, `12/03/2026`) with `options.locale`, which defaults to the grid's `locale`. The
`dateFormats` option lists date formats to read, and `booleanValues` lists words a checkbox
column reads as `true` and `false`.

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes Import from file.

**Example**  
```js
const importFile = hot.getPlugin('importFile');
const result = importFile.inferColumnTypes(rows, { locale: 'de-DE', headerRow: 'auto' });

hot.updateSettings({
  columns: result.columns.map(({ settings }) => settings),
  colHeaders: result.columns.map(({ title }) => title),
  data: importFile.convertToInferredTypes(rows, result),
});
```


### isEnabled

::: ask-about-api isEnabled|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L814

:::

_importFile.isEnabled()_

Enabled unless the `importFile` option is `false`; the engine decides what it can import.



### supportsImportFormat

::: ask-about-api supportsImportFormat|ImportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/importFile/importFile.ts#L848

:::

_importFile.supportsImportFormat(format) ⇒ boolean_

Returns `true` when the format can be read: `xlsx`, through the built-in engine or the one
configured in `engines`. An engine of unknown shape reads nothing and answers `false`. `'xlsx'` also
answers `false` whenever an xlsx import would throw for the license: when the license key names
tiers and none of them includes `feat:import_file`, the plugin's own feature, or none includes
`xlsx:import`. A key that names no tier is not restricted.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | The import format, e.g. `'xlsx'`. |



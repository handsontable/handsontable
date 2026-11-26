---
title: ExportFile
metaTitle: ExportFile | Handsontable DataGrid for JavaScript
permalink: /api/export-file
canonicalUrl: /api/export-file
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4j5eqkhw
description: Use the ExportFile plugin with its API options, members, and methods to export grid data to a CSV or an Excel (.xlsx) file, as a download, a Blob, or a string.
react:
  id: qsmpym52
  metaTitle: ExportFile | Handsontable DataGrid for React
angular:
  id: q3j6s4yz
  metaTitle: ExportFile | Handsontable DataGrid for Angular
---

[[toc]]

See the [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md) guide for examples and configuration details. See the [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md) guide for examples and configuration details.

## Options

### exportFile
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api exportFile|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3368

:::

_exportFile.exportFile : boolean | object_

The `exportFile` option configures the `ExportFile` plugin.

You can set the `exportFile` option to one of the following:

| Setting     | Description                                                                                |
| ----------- | ------------------------------------------------------------------------------------------ |
| `undefined` | Use the `ExportFile` plugin with the default configuration, with the context-menu entry hidden |
| `true`      | Use the plugin with the default configuration (built-in xlsx engine), with the context-menu entry shown |
| `false`     | The same as `true`: the plugin stays enabled, its API keeps working, and the context-menu entry is shown. To hide the entry, leave the option `undefined` |
| An object   | Enable the `ExportFile` plugin and modify the plugin options        |

If you set the `exportFile` option to an object, you can configure the following options:

| Option    | Type     | Default | Description                                                                         |
| --------- | -------- | ------- | ----------------------------------------------------------------------------------- |
| `engines` | `Object` | –       | Optional. A map of format keys to engine modules. Pass `{ xlsx: ExcelJS }` to export through ExcelJS instead of the built-in engine. |

Read more:
- [Export to Excel](@/guides/accessories-and-menus/export-to-excel/export-to-excel.md)
- [Export to CSV](@/guides/accessories-and-menus/export-to-csv/export-to-csv.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)

**Default**: <code>undefined</code>  
**Since**: 17.1.0  
**Example**  
```js
// XLSX and CSV export with the built-in engine
exportFile: true,

// or export XLSX through ExcelJS
import ExcelJS from 'exceljs';

exportFile: {
  engines: { xlsx: ExcelJS },
},
```

## Members

### LICENSE

::: ask-about-api LICENSE|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L202

:::

_ExportFile.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L183

:::

_ExportFile.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L188

:::

_ExportFile.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L207

:::

_ExportFile.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.


## Methods

### destroy

::: ask-about-api destroy|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L244

:::

_exportFile.destroy()_

Revokes the object URL of every download whose revoke timeout has not run yet, then runs the
base plugin teardown. `Core#destroy` clears every `_registerTimeout` before the plugins are
destroyed, so a grid torn down within the timeout would otherwise keep each blob alive until the
page unloads.



### disablePlugin

::: ask-about-api disablePlugin|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L236

:::

_exportFile.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### downloadFile

::: ask-about-api downloadFile|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L377

:::

_exportFile.downloadFile(format, options) ⇒ void_

Triggers a synchronous file download for text-based export formats (e.g. `'csv'`).

Calling this method with a binary format (e.g. `'xlsx'`) throws an error — use
[ExportFile#downloadFileAsync](@/api/exportFile.md#downloadfileasync) instead.

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes Export to file.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Charset label of the Blob; the content is always UTF-8. |
| [options.bom] | `boolean` |  | `optional` Include BOM signature. Default depends on format. |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers. |
| [options.exportHiddenColumns] | `boolean` | <code>false</code> | `optional` Include hidden columns. |
| [options.exportHiddenRows] | `boolean` | <code>false</code> | `optional` Include hidden rows. |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range: `[startRow, startColumn, endRow, endColumn]`. |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Sanitization (CSV only). |



### downloadFileAsync

::: ask-about-api downloadFileAsync|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L422

:::

_exportFile.downloadFileAsync(format, options) ⇒ Promise&lt;void&gt;_

Triggers an asynchronous file download. Supports all export formats.

For text-based formats (e.g. `'csv'`), the download is triggered immediately
and the returned `Promise` resolves right away.
For binary formats (e.g. `'xlsx'`), the export runs asynchronously. When the
`dialog` plugin is enabled, a progress overlay is shown for the duration of the export. The
export reads the data after the overlay is painted, so a [Core#loadData](@/api/core.md#loaddata) call made before
that, for example a sheets bar switch, rejects the returned `Promise` and downloads nothing.

**Throws**:

- <code>Error</code> The returned promise rejects when the license key names tiers and none of them includes Export to file.

**Since**: 17.1.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'` or `'xlsx'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Charset label of the Blob and the download; the content is always UTF-8 (text formats only). |
| [options.bom] | `boolean` |  | `optional` Include BOM signature (text formats only). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers. |
| [options.exportHiddenColumns] | `boolean` <br/> `string` | <code>false</code> | `optional` Hidden columns: `true` exports them visible, `false` leaves them out, `'hide'` writes them hidden in the sheet (XLSX only). |
| [options.exportHiddenRows] | `boolean` <br/> `string` | <code>false</code> | `optional` Hidden rows: `true` exports them visible, `false` leaves them out, `'hide'` writes them hidden in the sheet (XLSX only). |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range: `[startRow, startColumn, endRow, endColumn]`. |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Sanitization (CSV only). |
| [options.exportFormulas] | `boolean` | <code>false</code> | `optional` Export cell formulas instead of their computed values (XLSX only). |
| [options.compression] | `boolean` <br/> `number` |  | `optional` DEFLATE compression (XLSX only). Omitted, `null`, `true` or any value other than `false` and a number 1–9 compresses at level 6. A number 1–9 sets the level on the ExcelJS engine; the built-in engine always uses the platform's default level. `false` stores the entries uncompressed. |
| [options.conditionalFormatting] | `Array<ConditionalFormattingDescriptor>` | <code>[]</code> | `optional` Conditional formatting rules to apply to the exported file (XLSX only). |
| [options.sheets] | `Array<SheetOptions>` | <code>[]</code> | `optional` Configuration for multi-sheet export. Each entry defines one worksheet (XLSX only). |
| [options.headerStyle] | `HeaderStyle` <br/> `null` |  | `optional` Fill and border of the header cells (XLSX only). Defaults to a light-gray fill with a thin border; an object replaces the whole default, `null` writes unstyled headers. |
| [options.engine] | `object` <br/> `null` |  | `optional` Engine for this call only (XLSX only). `null` or an absent key keeps the engine from the `engines` setting, or the built-in one. |
| [options.protection] | `object` <br/> `null` |  | `optional` Sheet protection of read-only cells (XLSX only). Unset protects a sheet that has a read-only cell with no password, and `null` protects no sheet. With the built-in engine, an export that protects a sheet with a password needs a secure context (https or localhost), or it rejects. |
| [options.protection.password] | `string` |  | `optional` The sheet password, at most 255 characters. An empty one sets no password. |



### enablePlugin

::: ask-about-api enablePlugin|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L222

:::

_exportFile.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### exportAsBlob

::: ask-about-api exportAsBlob|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L309

:::

_exportFile.exportAsBlob(format, options) ⇒ Blob_

Exports table data as a blob object.

This method is only supported for text-based formats such as CSV.
Calling it with a binary format (e.g. `'xlsx'`) throws an error — use
[ExportFile#exportAsBlobAsync](@/api/exportFile.md#exportasblobasync) instead.

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes Export to file.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Charset label of the Blob; the content is always UTF-8. |
| [options.bom] | `boolean` |  | `optional` Include BOM signature. Default depends on format (e.g. `true` for CSV). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers. |
| [options.exportHiddenColumns] | `boolean` | <code>false</code> | `optional` Include hidden columns. |
| [options.exportHiddenRows] | `boolean` | <code>false</code> | `optional` Include hidden rows. |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range: `[startRow, startColumn, endRow, endColumn]`. |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Sanitization (CSV only). |



### exportAsBlobAsync

::: ask-about-api exportAsBlobAsync|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L350

:::

_exportFile.exportAsBlobAsync(format, options) ⇒ Promise&lt;Blob&gt;_

Exports table data as a blob object, asynchronously.

Supports all export formats. For text-based formats (e.g. `'csv'`),
the `Promise` resolves immediately. For binary formats (e.g. `'xlsx'`),
the export runs asynchronously.

**Throws**:

- <code>Error</code> The returned promise rejects when the license key names tiers and none of them includes Export to file.

**Since**: 17.1.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'` or `'xlsx'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Charset label of the Blob and the download; the content is always UTF-8 (text formats only). |
| [options.bom] | `boolean` |  | `optional` Include BOM signature (text formats only). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers. |
| [options.exportHiddenColumns] | `boolean` <br/> `string` | <code>false</code> | `optional` Hidden columns: `true` exports them visible, `false` leaves them out, `'hide'` writes them hidden in the sheet (XLSX only). |
| [options.exportHiddenRows] | `boolean` <br/> `string` | <code>false</code> | `optional` Hidden rows: `true` exports them visible, `false` leaves them out, `'hide'` writes them hidden in the sheet (XLSX only). |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range: `[startRow, startColumn, endRow, endColumn]`. |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Sanitization (CSV only). |
| [options.exportFormulas] | `boolean` | <code>false</code> | `optional` Export cell formulas instead of their computed values (XLSX only). |
| [options.compression] | `boolean` <br/> `number` |  | `optional` DEFLATE compression (XLSX only). Omitted, `null`, `true` or any value other than `false` and a number 1–9 compresses at level 6. A number 1–9 sets the level on the ExcelJS engine; the built-in engine always uses the platform's default level. `false` stores the entries uncompressed. |
| [options.conditionalFormatting] | `Array<ConditionalFormattingDescriptor>` | <code>[]</code> | `optional` Conditional formatting rules to apply to the exported file (XLSX only). |
| [options.sheets] | `Array<SheetOptions>` | <code>[]</code> | `optional` Configuration for multi-sheet export. Each entry defines one worksheet (XLSX only). |
| [options.headerStyle] | `HeaderStyle` <br/> `null` |  | `optional` Fill and border of the header cells (XLSX only). Defaults to a light-gray fill with a thin border; an object replaces the whole default, `null` writes unstyled headers. |
| [options.engine] | `object` <br/> `null` |  | `optional` Engine for this call only (XLSX only). `null` or an absent key keeps the engine from the `engines` setting, or the built-in one. |
| [options.protection] | `object` <br/> `null` |  | `optional` Sheet protection of read-only cells (XLSX only). Unset protects a sheet that has a read-only cell with no password, and `null` protects no sheet. With the built-in engine, an export that protects a sheet with a password needs a secure context (https or localhost), or it rejects. |
| [options.protection.password] | `string` |  | `optional` The sheet password, at most 255 characters. An empty one sets no password. |



### exportAsString

::: ask-about-api exportAsString|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L277

:::

_exportFile.exportAsString(format, options) ⇒ string_

Exports table data as a string.

This method is only supported for text-based formats such as CSV.
Calling it with a binary format (e.g. `'xlsx'`) throws an error.

**Throws**:

- <code>Error</code> When the license key names tiers and none of them includes Export to file.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type eq. `'csv'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type (e.g. `'text/csv'` for CSV). Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension (e.g. `'csv'`). Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Charset label of the Blob; the content is always UTF-8. |
| [options.bom] | `boolean` |  | `optional` Include BOM signature. Default depends on format (e.g. `true` for CSV). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers in the exported file. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers in the exported file. |
| [options.exportHiddenColumns] | `boolean` <br/> `string` | <code>false</code> | `optional` Controls how hidden columns are handled. `true` or `'hide'` exports them as normal columns, `false` omits them. |
| [options.exportHiddenRows] | `boolean` <br/> `string` | <code>false</code> | `optional` Controls how hidden rows are handled. `true` or `'hide'` exports them as normal rows, `false` omits them. |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Controls the sanitization of cell values (CSV only). |



### isEnabled

::: ask-about-api isEnabled|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L217

:::

_exportFile.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ExportFile#enablePlugin](@/api/exportFile.md#enableplugin) method is called.



### supportsExportFormat

::: ask-about-api supportsExportFormat|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/exportFile/exportFile.ts#L477

:::

_exportFile.supportsExportFormat(format) ⇒ boolean_

Returns `true` when the plugin can produce an export in the given format. `'csv'` always can,
because it needs no engine. `'xlsx'` can through the built-in xlsx engine or through the one
configured in `engines`; an engine of unknown shape writes nothing and answers `false`, which
is the same answer `ImportFile#supportsImportFormat` gives for that configuration. `'xlsx'` also
answers `false` whenever an xlsx export would throw for the license: when the license key names
tiers and none of them includes `feat:export_file`, the plugin's own feature, or none includes
`xlsx:export`. A key that names no tier is not restricted. `'csv'` does not read the license here, although the
export methods still need `feat:export_file` for it.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format — `'csv'` or `'xlsx'`. |



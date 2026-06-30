---
title: ExportFile
metaTitle: DropdownMenu - JavaScript Data Grid | Handsontable
permalink: /api/export-file
canonicalUrl: /api/export-file
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4j5eqkhw
description: Export your grid's data to the CSV format, as a downloadable file, a blob, or a string. Customize your export using Handsontable's configuration options.
react:
  id: qsmpym52
  metaTitle: ExportFile - React Data Grid | Handsontable
angular:
  id: q3j6s4yz
  metaTitle: ExportFile - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L159

:::

_ExportFile.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L164

:::

_ExportFile.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L169

:::

_ExportFile.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.


## Methods

### disablePlugin

::: ask-about-api disablePlugin|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L193

:::

_exportFile.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### downloadFile

::: ask-about-api downloadFile|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L308

:::

_exportFile.downloadFile(format, options) ⇒ void_

Triggers a synchronous file download for text-based export formats (e.g. `'csv'`).

Calling this method with a binary format (e.g. `'xlsx'`) throws an error — use
[[ExportFile#downloadFileAsync]] instead.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Character encoding. |
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L345

:::

_exportFile.downloadFileAsync(format, options) ⇒ Promise&lt;void&gt;_

Triggers an asynchronous file download. Supports all export formats.

For text-based formats (e.g. `'csv'`), the download is triggered immediately
and the returned `Promise` resolves right away.
For binary formats (e.g. `'xlsx'`), the export runs asynchronously. When the
`dialog` plugin is enabled, a progress overlay is shown for the duration of the export.

**Since**: 17.1.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'` or `'xlsx'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Character encoding (text formats only). |
| [options.bom] | `boolean` |  | `optional` Include BOM signature (text formats only). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers. |
| [options.exportHiddenColumns] | `boolean` | <code>false</code> | `optional` Include hidden columns. |
| [options.exportHiddenRows] | `boolean` | <code>false</code> | `optional` Include hidden rows. |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range: `[startRow, startColumn, endRow, endColumn]`. |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Sanitization (CSV only). |
| [options.exportFormulas] | `boolean` | <code>false</code> | `optional` Export cell formulas instead of their computed values (XLSX only). |
| [options.compression] | `boolean` <br/> `number` |  | `optional` Enable DEFLATE compression: `true` uses level 6; a number 1–9 sets a specific level. Omit or pass a falsy value to use no compression (XLSX only). |
| [options.conditionalFormatting] | `Array<ConditionalFormattingDescriptor>` | <code>[]</code> | `optional` Conditional formatting rules to apply to the exported file (XLSX only). |
| [options.sheets] | `Array<SheetOptions>` | <code>[]</code> | `optional` Configuration for multi-sheet export. Each entry defines one worksheet (XLSX only). |



### enablePlugin

::: ask-about-api enablePlugin|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L184

:::

_exportFile.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### exportAsBlob

::: ask-about-api exportAsBlob|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L248

:::

_exportFile.exportAsBlob(format, options) ⇒ Blob_

Exports table data as a blob object.

This method is only supported for text-based formats such as CSV.
Calling it with a binary format (e.g. `'xlsx'`) throws an error — use
[[ExportFile#exportAsBlobAsync]] instead.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Character encoding. |
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L283

:::

_exportFile.exportAsBlobAsync(format, options) ⇒ Promise&lt;Blob&gt;_

Exports table data as a blob object, asynchronously.

Supports all export formats. For text-based formats (e.g. `'csv'`),
the `Promise` resolves immediately. For binary formats (e.g. `'xlsx'`),
the export runs asynchronously.

**Since**: 17.1.0  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type e.g. `'csv'` or `'xlsx'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type. Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension. Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Character encoding (text formats only). |
| [options.bom] | `boolean` |  | `optional` Include BOM signature (text formats only). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers. |
| [options.exportHiddenColumns] | `boolean` | <code>false</code> | `optional` Include hidden columns. |
| [options.exportHiddenRows] | `boolean` | <code>false</code> | `optional` Include hidden rows. |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range: `[startRow, startColumn, endRow, endColumn]`. |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Sanitization (CSV only). |
| [options.exportFormulas] | `boolean` | <code>false</code> | `optional` Export cell formulas instead of their computed values (XLSX only). |
| [options.compression] | `boolean` <br/> `number` |  | `optional` Enable DEFLATE compression: `true` uses level 6; a number 1–9 sets a specific level. Omit or pass a falsy value to use no compression (XLSX only). |
| [options.conditionalFormatting] | `Array<ConditionalFormattingDescriptor>` | <code>[]</code> | `optional` Conditional formatting rules to apply to the exported file (XLSX only). |
| [options.sheets] | `Array<SheetOptions>` | <code>[]</code> | `optional` Configuration for multi-sheet export. Each entry defines one worksheet (XLSX only). |



### exportAsString

::: ask-about-api exportAsString|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L218

:::

_exportFile.exportAsString(format, options) ⇒ string_

Exports table data as a string.

This method is only supported for text-based formats such as CSV.
Calling it with a binary format (e.g. `'xlsx'`) throws an error.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| format | `string` |  | Export format type eq. `'csv'`. |
| options | `object` |  | Export options. |
| [options.mimeType] | `string` |  | `optional` MIME type (e.g. `'text/csv'` for CSV). Default depends on format. |
| [options.fileExtension] | `string` |  | `optional` File extension (e.g. `'csv'`). Default depends on format. |
| [options.filename] | `string` | <code>"Handsontable [YYYY]-[MM]-[DD]"</code> | `optional` File name. Placeholders `[YYYY]`, `[MM]`, `[DD]` are replaced with the current date. |
| [options.encoding] | `string` | <code>"utf-8"</code> | `optional` Character encoding. |
| [options.bom] | `boolean` |  | `optional` Include BOM signature. Default depends on format (e.g. `true` for CSV). |
| [options.columnDelimiter] | `string` | <code>","</code> | `optional` Column delimiter (CSV only). |
| [options.rowDelimiter] | `string` | <code>"\\r\\n"</code> | `optional` Row delimiter (CSV only). |
| [options.colHeaders] | `boolean` | <code>false</code> | `optional` Include column headers in the exported file. |
| [options.rowHeaders] | `boolean` | <code>false</code> | `optional` Include row headers in the exported file. |
| [options.exportHiddenColumns] | `boolean` <br/> `string` | <code>false</code> | `optional` Controls how hidden columns are handled. `true` exports them as normal visible columns. `false` omits them entirely. `'hide'` exports them and marks them as hidden in Excel (XLSX only). |
| [options.exportHiddenRows] | `boolean` <br/> `string` | <code>false</code> | `optional` Controls how hidden rows are handled. `true` exports them as normal visible rows. `false` omits them entirely. `'hide'` exports them and marks them as hidden in Excel (XLSX only). |
| [options.range] | `Array<number>` | <code>[]</code> | `optional` Cell range to export: `[startRow, startColumn, endRow, endColumn]` (visual indexes). |
| [options.sanitizeValues] | `boolean` <br/> `RegExp` <br/> `function` | <code>false</code> | `optional` Controls the sanitization of cell values (CSV only). |



### isEnabled

::: ask-about-api isEnabled|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L179

:::

_exportFile.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ExportFile#enablePlugin](@/api/exportFile.md#enableplugin) method is called.



### supportsExportFormat

::: ask-about-api supportsExportFormat|ExportFile

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/exportFile/exportFile.ts#L390

:::

_exportFile.supportsExportFormat(format) ⇒ boolean_

Returns `true` when the plugin can produce an export in the given format.

For text-based formats such as `'csv'`, no extra setup is required and the
method always returns `true`.
For binary formats such as `'xlsx'`, the method returns `true` only when the
corresponding engine has been provided in the plugin's `engines` map.


| Param | Type | Description |
| --- | --- | --- |
| format | `string` | Export format — `'csv'` or `'xlsx'`. |



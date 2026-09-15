---
title: CopyPaste
metaTitle: CopyPaste - JavaScript Data Grid | Handsontable
permalink: /api/copy-paste
canonicalUrl: /api/copy-paste
searchCategory: API Reference
hotPlugin: false
editLink: false
id: jtoc0ta4
description: Use the CopyPaste plugin with its API options, members, and methods to enable the copy/paste functionality, through the API, the context menu, and keyboard shortcuts.
react:
  id: g6fi2a6i
  metaTitle: CopyPaste - React Data Grid | Handsontable
angular:
  id: m3f2o0qr
  metaTitle: CopyPaste - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### copyPaste

::: ask-about-api copyPaste|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1381

:::

_copyPaste.copyPaste : object | boolean_

The `copyPaste` option configures the `CopyPaste` plugin.

You can set the `copyPaste` option to one of the following:

| Setting           | Description                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `true` (default)  | Enable the `CopyPaste` plugin with the default configuration                                     |
| `false`           | Disable the `CopyPaste` plugin                                                                   |
| An object         | - Enable the `CopyPaste` plugin<br>- Modify the `CopyPaste` plugin options |

##### copyPaste: Additional options

If you set the `copyPaste` option to an object, you can set the following `CopyPaste` plugin options:

| Option                   | Possible settings                                  | Description                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columnsLimit`           | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
| `rowsLimit`              | A number (default: `Infinity`)                     | The maximum number of columns that can be copied                                                                                                                                                    |
| `pasteMode`              | `'overwrite'` \| `'shift_down'` \| `'shift_right'` | When pasting:<br>`'overwrite'`: overwrite the currently-selected cells<br>`'shift_down'`: move the currently-selected cells down<br>`'shift_right'`: move the currently-selected cells to the right |
| `copyColumnHeaders`      | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with their nearest column headers                                                                                                         |
| `copyColumnGroupHeaders` | Boolean (default: `false`)                         | `true`: add a context menu option for copying cells along with all their related columns headers                                                                                                    |
| `copyColumnHeadersOnly`  | Boolean (default: `false`)                         | `true`: add a context menu option for copying column headers nearest to the selected cells (without copying cells)                                                                    |
| `uiContainer`            | An HTML element                                    | The UI container for the secondary focusable element                                                                                                                                                |

Read more:
- [Guides: Clipboard](@/guides/cell-features/clipboard/clipboard.md)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// enable the plugin with the default configuration
copyPaste: true // set by default

// disable the plugin
copyPaste: false,

// enable the plugin with a custom configuration
copyPaste: {
  // set a maximum number of columns that can be copied
  columnsLimit: 25,

  // set a maximum number of rows that can be copied
  rowsLimit: 50,

  // set the paste behavior
  pasteMode: 'shift_down',

  // add the option to copy cells along with their nearest column headers
  copyColumnHeaders: true,

  // add the option to copy cells along with all their related columns headers
  copyColumnGroupHeaders: true,

  // add the option to copy just column headers (without copying cells)
  copyColumnHeadersOnly: true,

  // set a UI container
  uiContainer: document.body,
},
```


### parsePastedValue

::: ask-about-api parsePastedValue|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7105

:::

_copyPaste.parsePastedValue : boolean_

The `parsePastedValue` option determines how pasted content is written to cells when the user pastes
from the clipboard into Handsontable (e.g. from another Handsontable instance or between cells in the same table).
It does not affect how other applications read or process the clipboard.

When set to `false`, pasted content is written as plain strings. Non-scalar values (e.g. objects) are coerced
to string, so an object becomes `"[object Object]"`.

When set to `true`, pasted text is parsed so that JSON-like (or other supported) values are converted to
JavaScript values and written to the data source. This allows copying and pasting more sophisticated JavaScript
structures (e.g. objects, arrays) between cells and between Handsontable instances. Cells then store the resulting
object (e.g. `{ id: 1, value: 'A1' }`). Schema validation is relaxed so object-based values can be pasted into
cells that would normally expect a scalar.

You can set the `parsePastedValue` option to one of the following:

| Setting           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `false` (default) | Write pasted content as plain strings            |
| `true`            | Parse pasted text and write JavaScript values    |

**Default**: <code>false</code>  
**Since**: 17.0.0  
**Example**  
```js
// write pasted content as strings (objects become "[object Object]")
parsePastedValue: false,
```
**Example**  
```js
// parse pasted text so cells receive JavaScript objects when pasted content is object-like
parsePastedValue: true,
```

## Members

### columnsLimit

::: ask-about-api columnsLimit|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L723

:::

_copyPaste.columnsLimit : number_

The maximum number of columns than can be copied to the clipboard.

**Default**: <code>Infinity</code>  


### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L246

:::

_CopyPaste.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### pasteMode

::: ask-about-api pasteMode|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L736

:::

_copyPaste.pasteMode : string_

When pasting:
- `'overwrite'` - overwrite the currently-selected cells
- `'shift_down'` - move currently-selected cells down
- `'shift_right'` - move currently-selected cells to the right

**Default**: <code>"overwrite"</code>  


### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L228

:::

_CopyPaste.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L241

:::

_CopyPaste.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### rowsLimit

::: ask-about-api rowsLimit|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L728

:::

_copyPaste.rowsLimit : number_

The maximum number of rows than can be copied to the clipboard.

**Default**: <code>Infinity</code>  


### SETTING_KEYS

::: ask-about-api SETTING_KEYS|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L233

:::

_CopyPaste.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.



### uiContainer

::: ask-about-api uiContainer|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L740

:::

_copyPaste.uiContainer : HTMLElement_

The UI container for the secondary focusable element.


## Methods

### copy

::: ask-about-api copy|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L354

:::

_copyPaste.copy([copyMode])_

Copies the contents of the selected cells (and/or their related column headers) to the system clipboard.

Takes an optional parameter (`copyMode`) that defines the scope of copying:

| `copyMode` value              | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `'cells-only'` (default)      | Copy the selected cells                                         |
| `'with-column-headers'`       | - Copy the selected cells<br>- Copy the nearest column headers  |
| `'with-column-group-headers'` | - Copy the selected cells<br>- Copy all related columns headers |
| `'column-headers-only'`       | Copy the nearest column headers (without copying cells)         |


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [copyMode] | `string` | <code>"cells-only"</code> | `optional` Copy mode. |



### copyCellsOnly

::: ask-about-api copyCellsOnly|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L361

:::

_copyPaste.copyCellsOnly()_

Copies the contents of the selected cells.



### copyColumnHeadersOnly

::: ask-about-api copyColumnHeadersOnly|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L366

:::

_copyPaste.copyColumnHeadersOnly()_

Copies the contents of column headers that are nearest to the selected cells.



### copyWithAllColumnHeaders

::: ask-about-api copyWithAllColumnHeaders|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L371

:::

_copyPaste.copyWithAllColumnHeaders()_

Copies the contents of the selected cells and all their related column headers.



### copyWithColumnHeaders

::: ask-about-api copyWithColumnHeaders|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L376

:::

_copyPaste.copyWithColumnHeaders()_

Copies the contents of the selected cells and their nearest column headers.



### cut

::: ask-about-api cut|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L381

:::

_copyPaste.cut()_

Cuts the contents of the selected cells to the system clipboard.



### destroy

::: ask-about-api destroy|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L669

:::

_copyPaste.destroy()_

Destroys the `CopyPaste` plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L338

:::

_copyPaste.disablePlugin()_

Disables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L268

:::

_copyPaste.enablePlugin()_

Enables the [`CopyPaste`](#copypaste) plugin for your Handsontable instance.



### getRangedCopyableData

::: ask-about-api getRangedCopyableData|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L390

:::

_copyPaste.getRangedCopyableData(ranges) ⇒ string_

Converts the contents of multiple ranges (`ranges`) into a single string.


| Param | Type | Description |
| --- | --- | --- |
| ranges | `Array<{startRow: number, startCol: number, endRow: number, endCol: number}>` | Array of objects with properties `startRow`, `endRow`, `startCol` and `endCol`. |


**Returns**: `string` - A string that will be copied to the clipboard.  

### getRangedData

::: ask-about-api getRangedData|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L399

:::

_copyPaste.getRangedData(ranges, [useSourceData]) ⇒ Array&lt;Array&gt;_

Converts the contents of multiple ranges (`ranges`) into an array of arrays.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ranges | `Array<{startRow: number, startCol: number, endRow: number, endCol: number}>` |  | Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`. |
| [useSourceData] | `boolean` | <code>false</code> | `optional` Whether to use the source data instead of the data. This will stringify objects as JSON. |


**Returns**: `Array<Array>` - An array of arrays that will be copied to the clipboard.  

### isEnabled

::: ask-about-api isEnabled|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L263

:::

_copyPaste.isEnabled() ⇒ boolean_

Checks if the [`CopyPaste`](#copypaste) plugin is enabled.

This method gets called by Handsontable's [`beforeInit`](@/api/hooks.md#beforeinit) hook.
If it returns `true`, the [`enablePlugin()`](#enableplugin) method gets called.



### paste

::: ask-about-api paste|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L428

:::

_copyPaste.paste(pastableText, [pastableHtml])_

Simulates the paste action.

For security reasons, modern browsers don't allow reading from the system clipboard.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pastableText | `string` |  | The value to paste, as a raw string. |
| [pastableHtml] | `string` | <code>""</code> | `optional` The value to paste, as HTML. |



### setCopyableText

::: ask-about-api setCopyableText|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L443

:::

_copyPaste.setCopyableText()_

Prepares copyable text from the cells selection in the invisible textarea.



### updatePlugin

::: ask-about-api updatePlugin|CopyPaste

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/copyPaste/copyPaste.ts#L331

:::

_copyPaste.updatePlugin()_

Updates the state of the [`CopyPaste`](#copypaste) plugin.

Gets called when [`updateSettings()`](@/api/core.md#updatesettings)
is invoked with any of the following configuration options:
 - [`copyPaste`](@/api/options.md#copypaste)
 - [`fragmentSelection`](@/api/options.md#fragmentselection)



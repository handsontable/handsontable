---
title: Formulas
metaTitle: Formulas | Handsontable DataGrid for JavaScript
permalink: /api/formulas
canonicalUrl: /api/formulas
searchCategory: API Reference
hotPlugin: false
editLink: false
id: y47bww7n
description: Use the Formulas plugin with its API options, members, and methods to perform Excel-like calculations in your business application.
react:
  id: of6l92wv
  metaTitle: Formulas | Handsontable DataGrid for React
angular:
  id: s1l8u6cd
  metaTitle: Formulas | Handsontable DataGrid for Angular
---

[[toc]]

See the [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md) guide for examples and configuration details.

## Options

### formulas
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api formulas|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L4198

:::

_formulas.formulas : object_

The `formulas` option configures the `Formulas` plugin.

The `Formulas` plugin uses the [HyperFormula](https://handsontable.github.io/hyperformula/) calculation engine.
To install [HyperFormula](https://handsontable.github.io/hyperformula/), read the following:
- [Formula calculation: Initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods)

You can set the `formulas` option to an object with the following properties:

| Property    | Possible values                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine`    | `HyperFormula` \|<br>A [HyperFormula](https://handsontable.github.io/hyperformula/) instance \|<br>A [HyperFormula configuration](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html) object |
| `sheetId`   | A number                                                                                                                                                                                                               |
| `sheetName` | A string                                                                                                                                                                                                               |
| `language`  | A [HyperFormula language pack](https://handsontable.github.io/hyperformula/guide/localizing-functions.html), imported from `hyperformula/es/i18n/languages`                                                          |
| `hyperlinks` | `true` \|<br>`false` (default) \|<br>An object with `target` and `schemes`                                                                                                                                                   |
| `batchEvaluation` | `true` \|<br>`false` (default)                                                                                                                                                                                  |

Set `batchEvaluation` to `true` to make HyperFormula recalculate once for the writes the grid makes while
its execution is suspended. [`batch()`](@/api/core.md#batch) is the way to get that saving, because it
suspends rendering too. Without the setting, every write recalculates.

A read of a formula cell through the grid, such as `getDataAtCell()`, recalculates first, so it never
returns a stale value. Each render recalculates too. For that reason
[`batchExecution()`](@/api/core.md#batchexecution), or a
[`suspendExecution()`](@/api/core.md#suspendexecution) and
[`resumeExecution()`](@/api/core.md#resumeexecution) pair, saves nothing when each write renders.

After a write, and until the next grid read or the end of the batch, a direct HyperFormula read
(`engine.getCellValue()`) throws "Computations are suspended". That includes another grid that shares the
engine. Read through the grid inside the batch, or read the engine after it.

Set `hyperlinks` to `true` to render a cell whose formula is `HYPERLINK()` as a link. The cell
keeps its own renderer, and the link label is the value the formula returns. Only a cell whose
root expression is `HYPERLINK()` becomes a link, so a nested call such as
`=CONCATENATE("see ", HYPERLINK("https://example.com"))` renders as plain text.

Set `hyperlinks` to an object to configure the links: `target` is `'_blank'` (default) or
`'_self'`, and `schemes` narrows the allowed URL schemes to a subset of `'http'`, `'https'`,
`'mailto'`, and `'tel'`.

A link is created only for the `http`, `https`, `mailto` and `tel` schemes. Any other scheme,
`javascript:` included, renders the label as plain text instead. Press
<kbd>**Alt**</kbd>+<kbd>**Enter**</kbd> to open the link of the selected cell. Each link
element gets the `ht-link` and `ht-hyperlink` classes. To link plain URLs in cell values, see
[`autoLink`](@/api/options.md#autolink).

Read more:
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [HyperFormula documentation: Client-side installation](https://handsontable.github.io/hyperformula/guide/client-side-installation)
- [HyperFormula documentation: Configuration options](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// either add the `HyperFormula` class
formulas: {
  // set `engine` to `HyperFormula`
  engine: HyperFormula,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// or, render `HYPERLINK()` formulas as links
formulas: {
  engine: HyperFormula,
  hyperlinks: true
}

// or, recalculate once for all writes made inside `batch()`
formulas: {
  engine: HyperFormula,
  batchEvaluation: true
}

// or, open `HYPERLINK()` links in the same tab and link only web URLs
formulas: {
  engine: HyperFormula,
  hyperlinks: {
    target: '_self',
    schemes: ['http', 'https']
  }
}

// or, add a HyperFormula instance
// initialized with the `'internal-use-in-handsontable'` license key
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

formulas: {
  // set `engine` to a HyperFormula instance
  engine: hyperformulaInstance,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// or, add a HyperFormula configuration object
formulas: {
  // set `engine` to a HyperFormula configuration object
  engine: {
    hyperformula: HyperFormula // or `engine: hyperformulaInstance`
    leapYear1900: false,       // this option comes from HyperFormula
    // add more HyperFormula configuration options
  },
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// use the same HyperFormula instance in multiple Handsontable instances

// a Handsontable instance `hot1`
formulas: {
  engine: HyperFormula,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// a Handsontable instance `hot2`
formulas: {
  engine: hot1.getPlugin('formulas').engine,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// set a language pack for the built-in function names and formula syntax
import plPL from 'hyperformula/es/i18n/languages/plPL';

formulas: {
  engine: HyperFormula,
  sheetName: 'Sheet 1',
  language: plPL
}

// update the language at runtime
hot.updateSettings({
  formulas: {
    language: plPL
  }
});
```


### preserveTextValue
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span> <span class="tag-config-scope">columns</span> <span class="tag-config-scope">cells</span> <span class="tag-config-scope">cell</span></p>

::: ask-about-api preserveTextValue|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L6403

:::

_formulas.preserveTextValue : boolean_

The `preserveTextValue` option configures whether the `Formulas`
plugin passes values of [`text`](@/guides/cell-types/cell-type/cell-type.md)-type cells
to the calculation engine as strings. This protects them from number coercion.

By default, the engine parses number-like strings into numbers. A `text` cell that
holds `0123456` reaches formulas as `123456` – the leading zero is lost. With
`preserveTextValue` enabled, the value stays a string: `=LEN(A1)` returns `7`, and
concatenation keeps the leading zero.

You can set the `preserveTextValue` option to one of the following:

| Setting           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `false` (default) | The engine parses values of `text` cells (number coercion)  |
| `true`            | Values of `text` cells reach the engine as strings          |

The option takes effect only for cells of the [`text`](@/api/options.md#type) type – the default cell
type, so setting `preserveTextValue` at the grid level affects every cell that doesn't
declare another type – and only when the `Formulas` plugin is
enabled. Custom cell types aren't supported, even when they reuse the text editor or
renderer.

Set the option globally, per column, or per cell (through the [`cell`](@/api/options.md#cell) option or
the [`cells`](@/api/options.md#cells) function).

Read more:
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)

**Default**: <code>false</code>  
**Since**: 18.1.0  
**Example**  
```js
columns: [
  {
    type: 'text',
    // keep leading zeros of number-like strings in formula results
    preserveTextValue: true,
  },
],
```

## Members

### columnAxisSyncer

::: ask-about-api columnAxisSyncer|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3893

:::

_formulas.columnAxisSyncer : AxisSyncer | null_

Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the columns.



### engine

::: ask-about-api engine|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3873

:::

_formulas.engine : HyperFormula | null_

The engine instance that will be used for this instance of Handsontable.



### indexSyncer

::: ask-about-api indexSyncer|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3885

:::

_formulas.indexSyncer : IndexSyncer | null_

Index synchronizer responsible for manipulating with some general options related to indexes synchronization.



### LICENSE

::: ask-about-api LICENSE|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2480

:::

_Formulas.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2469

:::

_Formulas.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2474

:::

_Formulas.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### rowAxisSyncer

::: ask-about-api rowAxisSyncer|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3889

:::

_formulas.rowAxisSyncer : AxisSyncer | null_

Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the rows.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2485

:::

_Formulas.SETTING\_KEYS_

Returns the list of settings keys observed by the plugin for configuration changes.



### sheetId

::: ask-about-api sheetId|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3877

:::

_formulas.sheetId : number | null_

HyperFormula's sheet id.



### sheetName

::: ask-about-api sheetName|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3881

:::

_formulas.sheetName : string | null_

HyperFormula's sheet name.


## Methods

### addSheet

::: ask-about-api addSheet|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2912

:::

_formulas.addSheet([sheetName], [sheetData]) ⇒ boolean | string_

Add a sheet to the shared HyperFormula instance.


| Param | Type | Description |
| --- | --- | --- |
| [sheetName] | `string` <br/> `null` | `optional` The new sheet name. If not provided (or a null is passed), will be auto-generated by HyperFormula. |
| [sheetData] | `Array` | `optional` Data passed to the shared HyperFormula instance. Has to be declared as an array of arrays - array of objects is not supported in this scenario. |


**Returns**: `boolean` | `string` - `false` if the data format is unusable or it is impossible to add a new sheet to the
engine, the created sheet name otherwise. When a grid that repaints because of the new sheet throws, the
sheet is already added and the error is rethrown once every grid has repainted.  

### destroy

::: ask-about-api destroy|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2881

:::

_formulas.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2733

:::

_formulas.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2501

:::

_formulas.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCellDependents

::: ask-about-api getCellDependents|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3099

:::

_formulas.getCellDependents(address) ⇒ Array_

Returns the cells and cell ranges that depend on the provided cell or range (its out-neighbors in
HyperFormula's dependency graph). These are the cells whose formulas reference the given address.

The `address` argument and the returned coordinates are in HyperFormula's index space, the same space
as `hot.getPlugin('formulas').engine`. HyperFormula indexes match Handsontable visual indexes only
when no rows or columns are trimmed, hidden, moved, or sorted. Named-expression references are returned
with a `sheet` id of `-1`. The result may include ranges that contain the given address, not only
single cells.

**Throws**:

- <code>Error</code> When `address` is neither an address nor a range, names a sheet id that does not exist, or is a range whose `start` and `end` are on different sheets.


| Param | Type | Description |
| --- | --- | --- |
| address | `object` | The cell address `{ sheet, row, col }` or range `{ start, end }`, in HyperFormula's index space. |


**Returns**: `Array` - An array of cell addresses and/or ranges in HyperFormula's index space.  

### getCellPrecedents

::: ask-about-api getCellPrecedents|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3115

:::

_formulas.getCellPrecedents(address) ⇒ Array_

Returns the cells and cell ranges that the provided cell or range depends on (its in-neighbors in
HyperFormula's dependency graph). These are the cells and ranges the given cell's formula reads.

The `address` argument and the returned coordinates are in HyperFormula's index space, the same space
as `hot.getPlugin('formulas').engine`. HyperFormula indexes match Handsontable visual indexes only
when no rows or columns are trimmed, hidden, moved, or sorted. Named-expression references are returned
with a `sheet` id of `-1`. The result may include ranges contained in the given cell or range, not
only single cells.

**Throws**:

- <code>Error</code> When `address` is neither an address nor a range, names a sheet id that does not exist, or is a range whose `start` and `end` are on different sheets.


| Param | Type | Description |
| --- | --- | --- |
| address | `object` | The cell address `{ sheet, row, col }` or range `{ start, end }`, in HyperFormula's index space. |


**Returns**: `Array` - An array of cell addresses and/or ranges in HyperFormula's index space.  

### getCellType

::: ask-about-api getCellType|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3026

:::

_formulas.getCellType(row, column, [sheet]) ⇒ string_

Get the cell type under specified visual coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [sheet] | `number` | `optional` The target sheet id, defaults to the current sheet. |


**Returns**: `string` - Possible values: 'FORMULA' | 'VALUE' | 'ARRAYFORMULA' | 'EMPTY'.  

### hideFormulas

::: ask-about-api hideFormulas|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3070

:::

_formulas.hideFormulas()_

Reverts [Formulas#showFormulas](@/api/formulas.md#showformulas): formula cells display their calculated value again. Does
nothing while the plugin is disabled.



### isEnabled

::: ask-about-api isEnabled|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2496

:::

_formulas.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Formulas#enablePlugin](@/api/formulas.md#enableplugin) method is called.



### isFormulaCellType

::: ask-about-api isFormulaCellType|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3047

:::

_formulas.isFormulaCellType(row, column, [sheet]) ⇒ boolean_

Returns `true` if under specified visual coordinates is formula.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [sheet] | `number` | `optional` The target sheet id, defaults to the current sheet. |



### isShowingFormulas

::: ask-about-api isShowingFormulas|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3083

:::

_formulas.isShowingFormulas() ⇒ boolean_

Returns `true` when formula cells are currently displaying their formula text instead of their
calculated value (see [Formulas#showFormulas](@/api/formulas.md#showformulas)).



### registerShortcuts <span class="tag-deprecated">Deprecated</span>

::: ask-about-api registerShortcuts|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2793

:::

_formulas.registerShortcuts()_

::: warning
Since 19.0.0. The &#x60;Alt&#x60;+&#x60;Enter&#x60; shortcut that opens a cell&#x27;s link is a core grid
shortcut now, registered for every grid, so the plugin has nothing to register. The method does
nothing and will be removed in 20.0.0.
:::
Deprecated. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut now,
registered for every grid, so the plugin has nothing to register. This method is a no-op.



### showFormulas

::: ask-about-api showFormulas|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L3059

:::

_formulas.showFormulas()_

Makes every formula cell display its formula text (for example `=SUM(A1:A2)`) instead of its
calculated value, until [Formulas#hideFormulas](@/api/formulas.md#hideformulas) is called. Copying a formula cell in this
mode copies its formula text, matching what is on screen. Toggled by default with
`Ctrl`+`` ` ``. Does nothing while the plugin is disabled.



### switchSheet

::: ask-about-api switchSheet|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2943

:::

_formulas.switchSheet(sheetName)_

Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
instance).

The engine's serialized content keeps the escape apostrophe that dates and preserved text values
were written with, so it is unescaped before the load – otherwise the apostrophe becomes part of
the grid's data.

The unescaping has to run BEFORE `loadData`, because afterwards the apostrophe is already part
of the grid's data, past every reader that could tell it apart from a user's own leading
apostrophe.

The two cases are unescaped differently. A RELOAD of the sheet this grid is already synced to
(what `#onAfterCellMetaReset` performs on the empty-data branch) is confirmed against the
grid's own source data – see `#unescapeAgainstSourceData` – so it survives the escaping
configuration being turned off between the write and the reload.

A switch to a genuinely DIFFERENT sheet has no such reference: the grid's data belongs to the
sheet being left. It is confirmed against the cell meta instead, with an accepted limitation –
that sheet's layout has no relation to this grid's index maps, so a physically-keyed meta layer
(the `cell` array, or a column-level one under a non-identity column map) can be matched
against the wrong cell. Only the global settings layer is layout-independent and always matches.


| Param | Type | Description |
| --- | --- | --- |
| sheetName | `string` | Sheet name used in the shared HyperFormula instance. |



### unregisterShortcuts <span class="tag-deprecated">Deprecated</span>

::: ask-about-api unregisterShortcuts|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulas/formulas.ts#L2805

:::

_formulas.unregisterShortcuts()_

::: warning
Since 19.0.0. The &#x60;Alt&#x60;+&#x60;Enter&#x60; shortcut that opens a cell&#x27;s link is a core grid
shortcut now, registered for every grid, so the plugin has nothing to unregister. The method does
nothing and will be removed in 20.0.0.
:::
Deprecated. The `Alt`+`Enter` shortcut that opens a cell's link is a core grid shortcut now,
registered for every grid, so the plugin has nothing to unregister. This method is a no-op.



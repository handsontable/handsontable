---
title: Formulas
metaTitle: Formulas - JavaScript Data Grid | Handsontable
permalink: /api/formulas
canonicalUrl: /api/formulas
searchCategory: API Reference
hotPlugin: false
editLink: false
id: y47bww7n
description: Use the Formulas plugin with its API options, members, and methods to perform Excel-like calculations in your business application.
react:
  id: of6l92wv
  metaTitle: Formulas - React Data Grid | Handsontable
angular:
  id: s1l8u6cd
  metaTitle: Formulas - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### formulas

::: ask-about-api formulas|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3071

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
| `hyperlinks` | `true` \|<br>`false` (default)                                                                                                                                                                                        |

Set `hyperlinks` to `true` to render a cell whose formula is `HYPERLINK()` as a link. The cell
keeps its own renderer, and the link label is the value the formula returns. Only a cell whose
root expression is `HYPERLINK()` becomes a link, so a nested call such as
`=CONCATENATE("see ", HYPERLINK("https://example.com"))` renders as plain text.

A link is created only for the `http`, `https`, `mailto` and `tel` schemes. Any other scheme,
`javascript:` included, renders the label as plain text instead. Press
<kbd>**Alt**</kbd>+<kbd>**Enter**</kbd> to open the link of the selected cell.

Read more:
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [HyperFormula documentation: Client-side installation](https://handsontable.github.io/hyperformula/guide/client-side-installation)
- [HyperFormula documentation: Configuration options](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
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

## Members

### columnAxisSyncer

::: ask-about-api columnAxisSyncer|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L1233

:::

_formulas.columnAxisSyncer : AxisSyncer | null_

Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the columns.



### engine

::: ask-about-api engine|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L1213

:::

_formulas.engine : HyperFormula | null_

The engine instance that will be used for this instance of Handsontable.



### indexSyncer

::: ask-about-api indexSyncer|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L1225

:::

_formulas.indexSyncer : IndexSyncer | null_

Index synchronizer responsible for manipulating with some general options related to indexes synchronization.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L551

:::

_Formulas.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L556

:::

_Formulas.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### rowAxisSyncer

::: ask-about-api rowAxisSyncer|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L1229

:::

_formulas.rowAxisSyncer : AxisSyncer | null_

Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the rows.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L561

:::

_Formulas.SETTING\_KEYS_

Returns the list of settings keys observed by the plugin for configuration changes.



### sheetId

::: ask-about-api sheetId|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L1217

:::

_formulas.sheetId : number | null_

HyperFormula's sheet id.



### sheetName

::: ask-about-api sheetName|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L1221

:::

_formulas.sheetName : string | null_

HyperFormula's sheet name.


## Methods

### addSheet

::: ask-about-api addSheet|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L776

:::

_formulas.addSheet([sheetName], [sheetData]) ⇒ boolean | string_

Add a sheet to the shared HyperFormula instance.


| Param | Type | Description |
| --- | --- | --- |
| [sheetName] | `string` <br/> `null` | `optional` The new sheet name. If not provided (or a null is passed), will be auto-generated by HyperFormula. |
| [sheetData] | `Array` | `optional` Data passed to the shared HyperFormula instance. Has to be declared as an array of arrays - array of objects is not supported in this scenario. |


**Returns**: `boolean` | `string` - `false` if the data format is unusable or it is impossible to add a new sheet to the
engine, the created sheet name otherwise.  

### destroy

::: ask-about-api destroy|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L758

:::

_formulas.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L712

:::

_formulas.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L577

:::

_formulas.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCellType

::: ask-about-api getCellType|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L819

:::

_formulas.getCellType(row, column, [sheet]) ⇒ string_

Get the cell type under specified visual coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [sheet] | `number` | `optional` The target sheet id, defaults to the current sheet. |


**Returns**: `string` - Possible values: 'FORMULA' | 'VALUE' | 'ARRAYFORMULA' | 'EMPTY'.  

### isEnabled

::: ask-about-api isEnabled|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L572

:::

_formulas.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Formulas#enablePlugin](@/api/formulas.md#enableplugin) method is called.



### isFormulaCellType

::: ask-about-api isFormulaCellType|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L840

:::

_formulas.isFormulaCellType(row, column, [sheet]) ⇒ boolean_

Returns `true` if under specified visual coordinates is formula.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [sheet] | `number` | `optional` The target sheet id, defaults to the current sheet. |



### switchSheet

::: ask-about-api switchSheet|Formulas

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/formulas/formulas.ts#L801

:::

_formulas.switchSheet(sheetName)_

Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
instance).


| Param | Type | Description |
| --- | --- | --- |
| sheetName | `string` | Sheet name used in the shared HyperFormula instance. |



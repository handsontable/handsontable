---
title: Formulas
metaTitle: Formulas - JavaScript Data Grid | Handsontable
permalink: /api/formulas
canonicalUrl: /api/formulas
searchCategory: API Reference
hotPlugin: true
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

# Plugin: Formulas

[[toc]]

## Description

This plugin allows you to perform Excel-like calculations in your business applications. It does it by an
integration with our other product, [HyperFormula](https://github.com/handsontable/hyperformula/), which is a
powerful calculation engine with an extensive number of features.

To test out HyperFormula, see [this guide](@/guides/formulas/formula-calculation/formula-calculation.md#available-functions).


## Options

### formulas
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/dataMap/metaManager/metaSchema.js#L2512

:::

_formulas.formulas : object_

The `formulas` option configures the [`Formulas`](@/api/formulas.md) plugin.

The [`Formulas`](@/api/formulas.md) plugin uses the [HyperFormula](https://handsontable.github.io/hyperformula/) calculation engine.
To install [HyperFormula](https://handsontable.github.io/hyperformula/), read the following:
- [Formula calculation: Initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods)

You can set the `formulas` option to an object with the following properties:

| Property    | Possible values                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine`    | `HyperFormula` \|<br>A [HyperFormula](https://handsontable.github.io/hyperformula/) instance \|<br>A [HyperFormula configuration](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html) object |
| `sheetId`   | A number                                                                                                                                                                                                               |
| `sheetName` | A string                                                                                                                                                                                                               |

Read more:
- [Plugins: `Formulas`](@/api/formulas.md)
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [HyperFormula documentation: Client-side installation](https://handsontable.github.io/hyperformula/guide/client-side-installation)
- [HyperFormula documentation: Configuration options](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html)

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
```

## Members

### columnAxisSyncer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L141

:::

_formulas.columnAxisSyncer : AxisSyncer | null_

Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the columns.



### engine
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L110

:::

_formulas.engine : HyperFormula | null_

The engine instance that will be used for this instance of Handsontable.



### indexSyncer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L129

:::

_formulas.indexSyncer : IndexSyncer | null_

Index synchronizer responsible for manipulating with some general options related to indexes synchronization.



### rowAxisSyncer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L135

:::

_formulas.rowAxisSyncer : AxisSyncer | null_

Index synchronizer responsible for syncing the order of HOT and HF's data for the axis of the rows.



### sheetId
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L117

:::

_formulas.sheetId : number | null_

HyperFormula's sheet id.



### sheetName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L123

:::

_formulas.sheetName : string | null_

HyperFormula's sheet name.


## Methods

### addSheet
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L377

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L346

:::

_formulas.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L292

:::

_formulas.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L156

:::

_formulas.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCellType
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L436

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L148

:::

_formulas.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Formulas#enablePlugin](@/api/formulas.md#enableplugin) method is called.



### isFormulaCellType
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L461

:::

_formulas.isFormulaCellType(row, column, [sheet]) ⇒ boolean_

Returns `true` if under specified visual coordinates is formula.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [sheet] | `number` | `optional` The target sheet id, defaults to the current sheet. |



### switchSheet
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/formulas/formulas.js#L412

:::

_formulas.switchSheet(sheetName)_

Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
instance).


| Param | Type | Description |
| --- | --- | --- |
| sheetName | `string` | Sheet name used in the shared HyperFormula instance. |



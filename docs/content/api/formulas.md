---
title: Formulas
metaTitle: Formulas - Plugin - Handsontable Documentation
permalink: /api/formulas
canonicalUrl: /api/formulas
hotPlugin: true
editLink: false
---

# Formulas

[[toc]]

## Description

This plugin allows you to perform Excel-like calculations in your business applications. It does it by an
integration with our other product, [HyperFormula](https://github.com/handsontable/hyperformula/), which is a
powerful calculation engine with an extensive number of features.

To test out HyperFormula, see [this guide](@/guides/formulas/formula-calculation.md#available-functions).


## Options

### formulas

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/dataMap/metaManager/metaSchema.js#L2178

:::

_formulas.formulas : object_

The `formulas` option configures the [`Formulas`](@/api/formulas.md) plugin.

The [`Formulas`](@/api/formulas.md) plugin uses the [HyperFormula](https://handsontable.github.io/hyperformula/) calculation engine.
To install [HyperFormula](https://handsontable.github.io/hyperformula/), read the following:
- [Formula calculation: Initialization methods &#8594;](@/guides/formulas/formula-calculation.md#initialization-methods)

You can set the `formulas` option to an object with the following properties:

| Property    | Possible values                                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `engine`    | `HyperFormula` \|<br>A [HyperFormula](https://handsontable.github.io/hyperformula/) instance \|<br>A [HyperFormula configuration](https://handsontable.github.io/hyperformula/api/interfaces/configparams.html) object |
| `sheetId`   | A number                                                                                                                                                                                                               |
| `sheetName` | A string                                                                                                                                                                                                               |

Read more:
- [Plugins: `Formulas` &#8594;](@/api/formulas.md)
- [Formula calculation &#8594;](@/guides/formulas/formula-calculation.md)
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
  engine: hyperFormulaInstance,
  sheetId: 1,
  sheetName: 'Sheet 1'
}

// or, add a HyperFormula configuration object
formulas: {
  // set `engine` to a HyperFormula configuration object
  engine: {
    hyperformula: HyperFormula // or `engine: hyperFormulaInstance`
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

### engine

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L104

:::

_formulas.engine : HyperFormula | null_

The engine instance that will be used for this instance of Handsontable.



### sheetId

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L118

:::

_formulas.sheetId : number | null_

HyperFormula's sheet id.



### sheetName

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L111

:::

_formulas.sheetName : string | null_

HyperFormula's sheet name.


## Methods

### addSheet

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L344

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

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L261

:::

_formulas.destroy()_

Destroys the plugin instance.



### disablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L213

:::

_formulas.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L136

:::

_formulas.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCellType

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L403

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

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L128

:::

_formulas.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [Formulas#enablePlugin](@/api/formulas.md#enableplugin) method is called.



### isFormulaCellType

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L428

:::

_formulas.isFormulaCellType(row, column, [sheet]) ⇒ boolean_

Returns `true` if under specified visual coordinates is formula.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| [sheet] | `number` | `optional` The target sheet id, defaults to the current sheet. |



### switchSheet

::: source-code-link https://github.com/handsontable/handsontable/blob/760fb398da288281451296618fbdf1ddc1056371/handsontable/src/plugins/formulas/formulas.js#L379

:::

_formulas.switchSheet(sheetName)_

Switch the sheet used as data in the Handsontable instance (it loads the data from the shared HyperFormula
instance).


| Param | Type | Description |
| --- | --- | --- |
| sheetName | `string` | Sheet name used in the shared HyperFormula instance. |

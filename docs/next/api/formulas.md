---
title: Formulas
permalink: /next/api/formulas
canonicalUrl: /api/formulas
editLink: false
---

# Formulas

[[toc]]

## Description

The formulas plugin.


## Options

### formulas
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L2768

:::

_formulas.formulas : boolean | object_

The [Formulas](./formulas/) plugin allows Handsontable to process formula expressions defined in the provided data.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable formulas plugin
formulas: true,

// or as an object with custom variables to be used in formula expressions
formulas: {
  variables: {
    FOO: 64,
    BAR: 'baz',
  }
},
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L436

:::

_formulas.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L125

:::

_formulas.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L88

:::

_formulas.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getCellValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L136

:::

_formulas.getCellValue(row, column) ⇒ \*_

Returns cell value (evaluated from formula expression) at specified cell coords.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |



### getVariable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L190

:::

_formulas.getVariable(name) ⇒ \*_

Returns variable name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Variable name. |



### hasComputedCellValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L149

:::

_formulas.hasComputedCellValue(row, column) ⇒ boolean_

Checks if there are any formula evaluations made under specific cell coords.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| column | `number` | Column index. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L80

:::

_formulas.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#Formulas+enablePlugin) method is called.



### recalculate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L156

:::

_formulas.recalculate()_

Recalculates all formulas (an algorithm will choose the best method of calculation).



### recalculateFull
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L163

:::

_formulas.recalculateFull()_

Recalculates all formulas (rebuild dependencies from scratch - slow approach).



### recalculateOptimized
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L170

:::

_formulas.recalculateOptimized()_

Recalculates all formulas (recalculate only changed cells - fast approach).



### setVariable
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/formulas/formulas.js#L180

:::

_formulas.setVariable(name, value)_

Sets predefined variable name which can be visible while parsing formula expression.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Variable name. |
| value | `*` | Variable value. |



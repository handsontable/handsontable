---
title: Autofill
permalink: /next/api/autofill
canonicalUrl: /api/autofill
editLink: false
---

# Autofill

[[toc]]

## Description

This plugin provides "drag-down" and "copy-down" functionalities, both operated using the small square in the right
bottom of the cell selection.

"Drag-down" expands the value of the selected cells to the neighbouring cells when you drag the small
square in the corner.

"Copy-down" copies the value of the selection to all empty cells below when you double click the small square.


## Options

### fillHandle
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L795

:::

`autofill.fillHandle : boolean | string | object`

Enables the fill handle (drag-down and copy-down) functionality, which shows a small rectangle in bottom
right corner of the selected area, that let's you expand values to the adjacent cells.

Setting to `true` enables the fillHandle plugin. Possible values: `true` (to enable in all directions),
`'vertical'` or `'horizontal'` (to enable in one direction), `false` (to disable completely), an object with
options: `autoInsertRow`, `direction`.

If `autoInsertRow` option is `true`, fill-handler will create new rows till it reaches the last row.
It is enabled by default.

**Default**: <code>true</code>  
**Category**: Autofill  
**Example**  
```js
// enable plugin in all directions and with autoInsertRow as true
fillHandle: true,

// or
// enable plugin in vertical direction and with autoInsertRow as true
fillHandle: 'vertical',

// or
fillHandle: {
  // enable plugin in both directions and with autoInsertRow as false
  autoInsertRow: false,
},

// or
fillHandle: {
  // enable plugin in vertical direction and with autoInsertRow as false
  autoInsertRow: false,
  direction: 'vertical'
},
```

## Members

### autoInsertRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L89

:::

`autofill.autoInsertRow : boolean`

Specifies if can insert new rows if needed.


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L636

:::

`autofill.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L131

:::

`autofill.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L104

:::

`autofill.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L97

:::

`autofill.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the Handsontable settings.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L122

:::

`autofill.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



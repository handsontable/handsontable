---
title: CustomBorders
metaTitle: CustomBorders - Plugin - Handsontable Documentation
permalink: /10.0/api/custom-borders
canonicalUrl: /api/custom-borders
hotPlugin: true
editLink: false
---

# CustomBorders

[[toc]]

## Description

This plugin enables an option to apply custom borders through the context menu (configurable with context menu key
`borders`).

To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in a form
of an array.

See [Custom Borders](@/guides/cell-features/formatting-cells.md#custom-cell-borders) demo for more examples.

**Example**  
```js
customBorders: [
  {
   range: {
     from: {
       row: 1,
       col: 1
     },
     to: {
       row: 3,
       col: 4
     },
   },
   left: {},
   right: {},
   top: {},
   bottom: {},
  },
],

// or
customBorders: [
  { row: 2,
    col: 2,
    left: {
      width: 2,
      color: 'red',
    },
    right: {
      width: 1,
      color: 'green',
    },
    top: '',
    bottom: '',
  }
],
```

## Options

### customBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L563

:::

_customBorders.customBorders : boolean | Array&lt;object&gt;_

If `true`, enables the [CustomBorders](#customborders) plugin, which enables an option to apply custom borders through the context
menu (configurable with context menu key `borders`). To initialize Handsontable with predefined custom borders,
provide cell coordinates and border styles in a form of an array.

See [Custom Borders](@/guides/cell-features/formatting-cells.md#custom-cell-borders) demo for examples.

**Default**: <code>false</code>  
**Example**  
```js
// enable custom borders
customBorders: true,

// or
// enable custom borders and start with predefined left border
customBorders: [
  {
    range: {
      from: {
        row: 1,
        col: 1
      },
      to: {
        row: 3,
        col: 4
      }
    },
    left: {
      width: 2,
      color: 'red'
    },
    right: {},
    top: {},
    bottom: {}
  }
],

// or
customBorders: [
  {
    row: 2,
    col: 2,
    left: {
      width: 2,
      color: 'red'
    },
    right: {
      width: 1,
      color: 'green'
    },
    top: '',
    bottom: ''
  }
],
```

## Methods

### clearBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L250

:::

_customBorders.clearBorders(selectionRanges)_

Clear custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.clearBorders([[1, 1, 2, 2], [6, 2, 0, 2]]);
// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
customBordersPlugin.clearBorders(hot.getSelectedRange());
// Using without param - clear all customBorders.
customBordersPlugin.clearBorders();
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L767

:::

_customBorders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L120

:::

_customBorders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L106

:::

_customBorders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L207

:::

_customBorders.getBorders(selectionRanges) ⇒ Array&lt;object&gt;_

Get custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.getBorders([[1, 1, 2, 2], [6, 2, 0, 2]]);
// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
customBordersPlugin.getBorders(hot.getSelectedRange());
// Using without param - return all customBorders.
customBordersPlugin.getBorders();
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |


**Returns**: `Array<object>` - Returns array of border objects.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L99

:::

_customBorders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [CustomBorders#enablePlugin](@/api/customBorders.md#enableplugin) method is called.



### setBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L158

:::

_customBorders.setBorders(selectionRanges, borderObject)_

Set custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.setBorders([[1, 1, 2, 2], [6, 2, 0, 2]], {left: {width: 2, color: 'blue'}});

// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
//  Selecting a cell range.
hot.selectCell(0, 0, 2, 2);
// Returning selected cells' range with the getSelectedRange method.
customBordersPlugin.setBorders(hot.getSelectedRange(), {left: {hide: false, width: 2, color: 'blue'}});
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |
| borderObject | `object` | Object with `top`, `right`, `bottom` and `left` properties. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/customBorders/customBorders.js#L129

:::

_customBorders.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



---
title: CustomBorders
metaTitle: CustomBorders - Plugin - Handsontable Documentation
permalink: /11.0/api/custom-borders
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/dataMap/metaManager/metaSchema.js#L721

:::

_customBorders.customBorders : boolean | Array&lt;object&gt;_

The `customBorders` option configures the [`CustomBorders`](@/api/customBorders.md) plugin.

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
(and add its menu items to the [context menu](@/guides/accessories-and-menus/context-menu.md)),
set the `customBorders` option to `true`.

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
and add a predefined border around a particular cell,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for one cell, and has the following properties:

| Property | Sub-properties     | Types                              | Description                                                       |
| -------- | ------------------ | ---------------------------------- | ----------------------------------------------------------------- |
| `row`    | -                  | `row`: Number                      | The cell's row coordinate.                                        |
| `col`    | -                  | `col`: Number                      | The cell's column coordinate.                                     |
| `left`   | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the left border's width (`width`)<br> and color (`color`).   |
| `right`  | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the right border's width (`width`)<br> and color (`color`).  |
| `top`    | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the top border's width (`width`)<br> and color (`color`).    |
| `bottom` | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the bottom border's width (`width`)<br> and color (`color`). |

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
and add a predefined border around a range of cells,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for a single range of cells, and has the following properties:

| Property | Sub-properties                               | Types                                                            | Description                                                                                  |
| -------- | -------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `range`  | `from` {`row`, `col`}<br>`to` {`row`, `col`} | `from`: Object<br>`to`: Object<br>`row`: Number<br>`col`: Number | `from` selects the range's top-left corner.<br>`to` selects the range's bottom-right corner. |
| `left`   | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the left border's `width` and `color`.                                                  |
| `right`  | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the right border's `width` and `color`.                                                 |
| `top`    | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the top border's `width` and `color`.                                                   |
| `bottom` | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the bottom border's `width` and `color`.                                                |

Read more:
- [Formatting cells: Custom cell borders &#8594;](@/guides/cell-features/formatting-cells.md#custom-cell-borders)
- [Context menu &#8594;](@/guides/accessories-and-menus/context-menu.md)
- [Plugins: `CustomBorders` &#8594;](@/api/customBorders.md)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `CustomBorders` plugin
customBorders: true,

// enable the `CustomBorders` plugin
// and add a predefined border for a particular cell
customBorders: [
  // add an object with a border configuration for one cell
  {
    // set the cell's row coordinate
    row: 2,
    // set the cell's column coordinate
    col: 2,
    // set the left border's width and color
    left: {
      width: 2,
      color: 'red'
    },
    // set the right border's width and color
    right: {
      width: 1,
      color: 'green'
    },
    // set the top border's width and color
    top: '',
    // set the bottom border's width and color
    bottom: ''
  }
],

// enable the `CustomBorders` plugin
// and add a predefined border for a range of cells
customBorders: [
  // add an object with a border configuration for one range of cells
  {
    // select a range of cells
    range: {
      // set the range's top-left corner
      from: {
        row: 1,
        col: 1
      },
      // set the range's bottom-right corner
      to: {
        row: 3,
        col: 4
      }
    },
    // set the left border's width and color
    left: {
      width: 2,
      color: 'red'
    },
    // set the right border's width and color
    right: {},
    // set the top border's width and color
    top: {},
    // set the bottom border's width and color
    bottom: {}
  }
],
```

## Methods

### clearBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L250

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L767

:::

_customBorders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L120

:::

_customBorders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L106

:::

_customBorders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L207

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L99

:::

_customBorders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [CustomBorders#enablePlugin](@/api/customBorders.md#enableplugin) method is called.



### setBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L158

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/customBorders/customBorders.js#L129

:::

_customBorders.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



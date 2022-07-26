---
title: CustomBorders
metaTitle: CustomBorders - Plugin - Handsontable Documentation
permalink: /12.1/api/custom-borders
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

See [`customBorders` configuration option](@/api/options.md#customborders) or go to
[Custom cell borders demo](@/guides/cell-features/formatting-cells.md#custom-cell-borders) for more examples.

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
   start: {},
   end: {},
   top: {},
   bottom: {},
  },
],

// or
customBorders: [
  { row: 2,
    col: 2,
    start: {
      width: 2,
      color: 'red',
    },
    end: {
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/dataMap/metaManager/metaSchema.js#L1410

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
| `start`  | `width`<br>`color` | `width`: Number<br>`color`: String | If the [layout direction](@/guides/internationalization/layout-direction.md) is LTR (default): `start` sets the width (`width`) and color (`color`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction.md) is RTL: `start` sets the width (`width`) and color (`color`) of the right-hand border. |
| `end`    | `width`<br>`color` | `width`: Number<br>`color`: String | If the [layout direction](@/guides/internationalization/layout-direction.md) is LTR (default): `end` sets the width (`width`) and color (`color`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction.md) is RTL: `end` sets the width (`width`) and color (`color`) of the left-hand border. |
| `top`    | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the width (`width`) and color (`color`) of the top border. |
| `bottom` | `width`<br>`color` | `width`: Number<br>`color`: String | Sets the width (`width`) and color (`color`) of the bottom border. |

To enable the [`CustomBorders`](@/api/customBorders.md) plugin
and add a predefined border around a range of cells,
set the `customBorders` option to an array of objects.
Each object represents a border configuration for a single range of cells, and has the following properties:

| Property | Sub-properties                               | Types                                                            | Description                                                                                  |
| -------- | -------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `range`  | `from` {`row`, `col`}<br>`to` {`row`, `col`} | `from`: Object<br>`to`: Object<br>`row`: Number<br>`col`: Number | If the [layout direction](@/guides/internationalization/layout-direction.md) is LTR (default):<br>- `from` selects the range's top-left corner.<br>- `to` selects the range's bottom-right corner.<br><br>If the [layout direction](@/guides/internationalization/layout-direction.md) is RTL: <br>- `from` selects the range's top-right corner.<br>- `to` selects the range's bottom-left corner. |
| `start`  | `width`<br>`color` | `width`: Number<br>`color`: String | If the [layout direction](@/guides/internationalization/layout-direction.md) is LTR (default): `start` sets the width (`width`) and color (`color`) of the left-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction.md) is RTL: `start` sets the width (`width`) and color (`color`) of the right-hand border. |
| `end`    | `width`<br>`color` | `width`: Number<br>`color`: String | If the [layout direction](@/guides/internationalization/layout-direction.md) is LTR (default): `end` sets the width (`width`) and color (`color`) of the right-hand border.<br><br>If the [layout direction](@/guides/internationalization/layout-direction.md) is RTL: `end` sets the width (`width`) and color (`color`) of the left-hand border. |
| `top`    | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the width (`width`) and color (`color`) of the top border. |
| `bottom` | `width`<br>`color`                           | `width`: Number<br>`color`: String                               | Sets the width (`width`) and color (`color`) of the bottom border. |

Read more:
- [Formatting cells: Custom cell borders](@/guides/cell-features/formatting-cells.md#custom-cell-borders)
- [Context menu](@/guides/accessories-and-menus/context-menu.md)
- [Plugins: `CustomBorders`](@/api/customBorders.md)
- [Layout direction](@/guides/internationalization/layout-direction.md)
- [`layoutDirection`](#layoutdirection)

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
    // set the left/right border's width and color
    start: {
      width: 2,
      color: 'red'
    },
    // set the right/left border's width and color
    end: {
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
    // set the left/right border's width and color
    start: {
      width: 2,
      color: 'red'
    },
    // set the right/left border's width and color
    end: {},
    // set the top border's width and color
    top: {},
    // set the bottom border's width and color
    bottom: {}
  }
],
```

## Methods

### clearBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L270

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L820

:::

_customBorders.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L129

:::

_customBorders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L115

:::

_customBorders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L227

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L108

:::

_customBorders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [CustomBorders#enablePlugin](@/api/customBorders.md#enableplugin) method is called.



### setBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L170

:::

_customBorders.setBorders(selectionRanges, borderObject)_

Set custom borders.

**Example**  
```js
const customBordersPlugin = hot.getPlugin('customBorders');

// Using an array of arrays (produced by `.getSelected()` method).
customBordersPlugin.setBorders([[1, 1, 2, 2], [6, 2, 0, 2]], {start: {width: 2, color: 'blue'}});

// Using an array of CellRange objects (produced by `.getSelectedRange()` method).
//  Selecting a cell range.
hot.selectCell(0, 0, 2, 2);
// Returning selected cells' range with the getSelectedRange method.
customBordersPlugin.setBorders(hot.getSelectedRange(), {start: {hide: false, width: 2, color: 'blue'}});
```

| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | `Array<Array>` <br/> `Array<CellRange>` | Array of selection ranges. |
| borderObject | `object` | Object with `top`, `right`, `bottom` and `start` properties. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/06d2c9b9d7d53dde2227350b0ab4d84a7ab93b97/handsontable/src/plugins/customBorders/customBorders.js#L141

:::

_customBorders.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`customBorders`](@/api/options.md#customborders)



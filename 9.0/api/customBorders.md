---
title: CustomBorders
permalink: /api/custom-borders
canonicalUrl: /api/custom-borders
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin enables an option to apply custom borders through the context menu (configurable with context menu key
`borders`).

To initialize Handsontable with predefined custom borders, provide cell coordinates and border styles in a form
of an array.

See [Custom Borders](https://handsontable.com/docs/demo-customizing-borders.html) demo for more examples.


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
## Functions:

### clearBorders
`customBorders.clearBorders(selectionRanges)`

Clear custom borders.


| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | <code>Array.&lt;Array&gt;</code> \| <code>Array.&lt;CellRange&gt;</code> | Array of selection ranges. |


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

### destroy
`customBorders.destroy()`

Destroys the plugin instance.



### disablePlugin
`customBorders.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
`customBorders.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getBorders
`customBorders.getBorders(selectionRanges) ⇒ Array.<object>`

Get custom borders.


| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | <code>Array.&lt;Array&gt;</code> \| <code>Array.&lt;CellRange&gt;</code> | Array of selection ranges. |


**Returns**: <code>Array.&lt;object&gt;</code> - Returns array of border objects.  
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

### isEnabled
`customBorders.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CustomBorders+enablePlugin) method is called.



### setBorders
`customBorders.setBorders(selectionRanges, borderObject)`

Set custom borders.


| Param | Type | Description |
| --- | --- | --- |
| selectionRanges | <code>Array.&lt;Array&gt;</code> \| <code>Array.&lt;CellRange&gt;</code> | Array of selection ranges. |
| borderObject | <code>object</code> | Object with `top`, `right`, `bottom` and `left` properties. |


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

### updatePlugin
`customBorders.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



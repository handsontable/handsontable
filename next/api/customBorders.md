---
title: CustomBorders
permalink: /next/api/custom-borders
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

## Methods:

### clearBorders

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
| selectionRanges | `Array.&lt;Array&gt;` \| `Array.&lt;CellRange&gt;` | Array of selection ranges. |



### destroy

_customBorders.destroy()_

Destroys the plugin instance.



### disablePlugin

_customBorders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_customBorders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBorders

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
| selectionRanges | `Array.&lt;Array&gt;` \| `Array.&lt;CellRange&gt;` | Array of selection ranges. |


**Returns**: `Array.&lt;object&gt;` - Returns array of border objects.  

### isEnabled

_customBorders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#CustomBorders+enablePlugin) method is called.



### setBorders

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
| selectionRanges | `Array.&lt;Array&gt;` \| `Array.&lt;CellRange&gt;` | Array of selection ranges. |
| borderObject | `object` | Object with `top`, `right`, `bottom` and `left` properties. |



### updatePlugin

_customBorders.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



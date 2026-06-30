---
title: CustomBorders
metaTitle: CustomBorders - JavaScript Data Grid | Handsontable
permalink: /api/custom-borders
canonicalUrl: /api/custom-borders
searchCategory: API Reference
hotPlugin: false
editLink: false
id: gxm1a98b
description: Use the CustomBorders plugin with its API options, members, and methods to set up custom borders for your cells, programmatically or using the context menu.
react:
  id: 93acldzf
  metaTitle: CustomBorders - React Data Grid | Handsontable
angular:
  id: n6g3p2st
  metaTitle: CustomBorders - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L143

:::

_CustomBorders.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L148

:::

_CustomBorders.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearBorders

::: ask-about-api clearBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L299

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

::: ask-about-api destroy|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L725

:::

_customBorders.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L171

:::

_customBorders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L161

:::

_customBorders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getBorders

::: ask-about-api getBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L261

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

::: ask-about-api isEnabled|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L156

:::

_customBorders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [CustomBorders#enablePlugin](@/api/customBorders.md#enableplugin) method is called.



### setBorders

::: ask-about-api setBorders|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L205

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

::: ask-about-api updatePlugin|CustomBorders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/customBorders/customBorders.ts#L180

:::

_customBorders.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`customBorders`](@/api/options.md#customborders)



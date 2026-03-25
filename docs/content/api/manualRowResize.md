---
title: ManualRowResize
metaTitle: ManualRowResize - JavaScript Data Grid | Handsontable
permalink: /api/manual-row-resize
canonicalUrl: /api/manual-row-resize
searchCategory: API Reference
hotPlugin: true
editLink: false
id: la7wo1xh
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change row heights using Handsontable's interface.
react:
  id: 7chricz2
  metaTitle: ManualRowResize - React Data Grid | Handsontable
angular:
  id: z4s5b3qr
  metaTitle: ManualRowResize - Angular Data Grid | Handsontable
---

# Plugin: ManualRowResize

[[toc]]

## Description

This plugin allows to change rows height.

The plugin creates additional components to make resizing possibly using user interface:
- handle - the draggable element that sets the desired height of the row.
- guide - the helper guide that shows the desired height as a horizontal guide.


## Options

### manualRowResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/dataMap/metaManager/metaSchema.js#L3611

:::

_manualRowResize.manualRowResize : boolean | Array&lt;number&gt;_

The `manualRowResize` option configures the [`ManualRowResize`](@/api/manualRowResize.md) plugin.

You can set the `manualRowResize` option to one of the following:

| Setting  | Description                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the [`ManualRowResize`](@/api/manualRowResize.md) plugin                                               |
| `false`  | Disable the [`ManualRowResize`](@/api/manualRowResize.md) plugin                                              |
| An array | - Enable the [`ManualRowResize`](@/api/manualRowResize.md) plugin<br>- Set initial heights of individual rows |

Read more:
- [Row height: Adjust the row height manually](@/guides/rows/row-height/row-height.md#adjust-the-row-height-manually)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ManualRowResize` plugin
manualRowResize: true,

// enable the `ManualRowResize` plugin
// set the initial height of row 0 to 40 pixels
// set the initial height of row 1 to 50 pixels
// set the initial height of row 2 to 60 pixels
manualRowResize: [40, 50, 60],
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L636

:::

_manualRowResize.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L163

:::

_manualRowResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L131

:::

_manualRowResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getLastDesiredRowHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L191

:::

_manualRowResize.getLastDesiredRowHeight() ⇒ number_

Returns the last desired row height set manually with the resize handle.


**Returns**: `number` - The last desired row height.  

### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L124

:::

_manualRowResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualRowResize#enablePlugin](@/api/manualRowResize.md#enableplugin) method is called.



### setManualSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L177

:::

_manualRowResize.setManualSize(row, height) ⇒ number_

Sets the new height for specified row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| height | `number` | Row height. |


**Returns**: `number` - Returns new height.  

### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e5a9f90198476bcda80b36c41c37309d8287e121/handsontable/src/plugins/manualRowResize/manualRowResize.js#L153

:::

_manualRowResize.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualRowResize`](@/api/options.md#manualrowresize)



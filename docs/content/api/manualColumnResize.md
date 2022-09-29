---
title: ManualColumnResize
metaTitle: ManualColumnResize - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-resize
canonicalUrl: /api/manual-column-resize
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change column widths using Handsontable's interface.
react:
  metaTitle: ManualColumnResize - React Data Grid | Handsontable
---

# ManualColumnResize

[[toc]]

## Description

This plugin allows to change columns width. To make columns width persistent the [Options#persistentState](@/api/options.md#persistentstate)
plugin should be enabled.

The plugin creates additional components to make resizing possibly using user interface:
- handle - the draggable element that sets the desired width of the column.
- guide - the helper guide that shows the desired width as a vertical guide.


## Options

### manualColumnResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/dataMap/metaManager/metaSchema.js#L2774

:::

_manualColumnResize.manualColumnResize : boolean | Array&lt;number&gt;_

The `manualColumnResize` option configures the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin.

You can set the `manualColumnResize` option to one of the following:

| Setting  | Description                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin                                                 |
| `false`  | Disable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin                                                |
| An array | - Enable the [`ManualColumnResize`](@/api/manualColumnResize.md) plugin<br>- Set initial widths of individual columns |

Read more:
- [Column width: Column stretching](@/guides/columns/column-width.md#column-stretching)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `manualColumnResize` plugin
manualColumnResize: true,

// enable the `manualColumnResize` plugin
// set the initial width of column 0 to 40 pixels
// set the initial width of column 1 to 50 pixels
// set the initial width of column 2 to 60 pixels
manualColumnResize: [40, 50, 60],
```

## Methods

### clearManualSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L185

:::

_manualColumnResize.clearManualSize(column)_

Clears the cache for the specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L631

:::

_manualColumnResize.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L133

:::

_manualColumnResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L97

:::

_manualColumnResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L90

:::

_manualColumnResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnResize#enablePlugin](@/api/manualColumnResize.md#enableplugin) method is called.



### loadManualColumnWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L156

:::

_manualColumnResize.loadManualColumnWidths() ⇒ Array_

Loads the previously saved sizes using the persistentState plugin (the [Options#persistentState](@/api/options.md#persistentstate) option has to be enabled).

**Emits**: [`Hooks#event:persistentStateLoad`](@/api/hooks.md#persistentstateload)  


### saveManualColumnWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L146

:::

_manualColumnResize.saveManualColumnWidths()_

Saves the current sizes using the persistentState plugin (the [Options#persistentState](@/api/options.md#persistentstate) option has to be enabled).

**Emits**: [`Hooks#event:persistentStateSave`](@/api/hooks.md#persistentstatesave)  


### setManualSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L171

:::

_manualColumnResize.setManualSize(column, width) ⇒ number_

Sets the new width for specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| width | `number` | Column width (no less than 20px). |


**Returns**: `number` - Returns new width.  

### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/manualColumnResize/manualColumnResize.js#L123

:::

_manualColumnResize.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnResize`](@/api/options.md#manualcolumnresize)



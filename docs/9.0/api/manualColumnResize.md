---
title: ManualColumnResize
metaTitle: ManualColumnResize - Plugin - Handsontable Documentation
permalink: /9.0/api/manual-column-resize
canonicalUrl: /api/manual-column-resize
editLink: false
---

# ManualColumnResize

[[toc]]

## Description

This plugin allows to change columns width. To make columns width persistent the [Options#persistentState](@/api/metaSchema.md#persistentstate)
plugin should be enabled.

The plugin creates additional components to make resizing possibly using user interface:
- handle - the draggable element that sets the desired width of the column.
- guide - the helper guide that shows the desired width as a vertical guide.


## Options

### manualColumnResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/dataMap/metaManager/metaSchema.js#L1907

:::

_manualColumnResize.manualColumnResize : boolean | Array&lt;number&gt;_

Turns on [Manual column resize](@/guides/columns/column-width.md#column-stretching), if set to a boolean or define initial column resized widths (an an array of widths).

**Default**: <code>undefined</code>  
**Example**  
```js
// as a boolean to enable column resize
manualColumnResize: true,

// as a array with initial widths
// (column at 0 index has 40px and column at 1 index has 50px)
manualColumnResize: [40, 50],
```

## Methods

### clearManualSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L172

:::

_manualColumnResize.clearManualSize(column)_

Clears the cache for the specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L616

:::

_manualColumnResize.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L120

:::

_manualColumnResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L87

:::

_manualColumnResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L80

:::

_manualColumnResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [ManualColumnResize#enablePlugin](@/api/manualColumnResize.md#enableplugin) method is called.



### loadManualColumnWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L143

:::

_manualColumnResize.loadManualColumnWidths() ⇒ Array_

Loads the previously saved sizes using the persistentState plugin (the [Options#persistentState](@/api/metaSchema.md#persistentstate) option has to be enabled).

**Emits**: [`Hooks#event:persistentStateLoad`](@/api/pluginHooks.md#persistentstateload)  


### saveManualColumnWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L133

:::

_manualColumnResize.saveManualColumnWidths()_

Saves the current sizes using the persistentState plugin (the [Options#persistentState](@/api/metaSchema.md#persistentstate) option has to be enabled).

**Emits**: [`Hooks#event:persistentStateSave`](@/api/pluginHooks.md#persistentstatesave)  


### setManualSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L158

:::

_manualColumnResize.setManualSize(column, width) ⇒ number_

Sets the new width for specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| width | `number` | Column width (no less than 20px). |


**Returns**: `number` - Returns new width.  

### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnResize/manualColumnResize.js#L110

:::

_manualColumnResize.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



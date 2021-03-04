---
title: ManualColumnResize
permalink: /8.3/api/manual-column-resize
canonicalUrl: /api/manual-column-resize
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin allows to change columns width. To make columns width persistent the [Options#persistentState](./Options/#persistentState)
plugin should be enabled.

The plugin creates additional components to make resizing possibly using user interface:
- handle - the draggable element that sets the desired width of the column.
- guide - the helper guide that shows the desired width as a vertical guide.


## Functions:

### isEnabled
`manualColumnResize.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ManualColumnResize+enablePlugin) method is called.



### enablePlugin
`manualColumnResize.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`manualColumnResize.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



### disablePlugin
`manualColumnResize.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### saveManualColumnWidths
`manualColumnResize.saveManualColumnWidths()`

Saves the current sizes using the persistentState plugin (the [Options#persistentState](./Options/#persistentState) option has to be enabled).

**Emits**: <code>Hooks#event:persistentStateSave</code>  


### loadManualColumnWidths
`manualColumnResize.loadManualColumnWidths() ⇒ Array`

Loads the previously saved sizes using the persistentState plugin (the [Options#persistentState](./Options/#persistentState) option has to be enabled).

**Emits**: <code>Hooks#event:persistentStateLoad</code>  


### setManualSize
`manualColumnResize.setManualSize(column, width) ⇒ number`

Sets the new width for specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |
| width | <code>number</code> | Column width (no less than 20px). |


**Returns**: <code>number</code> - Returns new width.  

### clearManualSize
`manualColumnResize.clearManualSize(column)`

Clears the cache for the specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |



### destroy
`manualColumnResize.destroy()`

Destroys the plugin instance.



---
title: ManualRowResize
permalink: /8.6/api/manual-row-resize
canonicalUrl: /api/manual-row-resize
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin allows to change rows height. To make rows height persistent the [Options#persistentState](./Options/#persistentState)
plugin should be enabled.

The plugin creates additional components to make resizing possibly using user interface:
- handle - the draggable element that sets the desired height of the row.
- guide - the helper guide that shows the desired height as a horizontal guide.


## Functions:

### destroy
`manualRowResize.destroy()`

Destroys the plugin instance.



### disablePlugin
`manualRowResize.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
`manualRowResize.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### isEnabled
`manualRowResize.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ManualRowResize+enablePlugin) method is called.



### loadManualRowHeights
`manualRowResize.loadManualRowHeights() ⇒ Array`

Loads the previously saved sizes using the persistentState plugin (the [Options#persistentState](./Options/#persistentState) option
has be enabled).

**Emits**: <code>Hooks#event:persistentStateLoad</code>  


### saveManualRowHeights
`manualRowResize.saveManualRowHeights()`

Saves the current sizes using the persistentState plugin (the [Options#persistentState](./Options/#persistentState) option has to be
enabled).

**Emits**: <code>Hooks#event:persistentStateSave</code>  


### setManualSize
`manualRowResize.setManualSize(row, height) ⇒ number`

Sets the new height for specified row index.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| height | <code>number</code> | Row height. |


**Returns**: <code>number</code> - Returns new height.  

### updatePlugin
`manualRowResize.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



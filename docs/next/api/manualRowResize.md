---
title: ManualRowResize
metaTitle: ManualRowResize - Plugin - Handsontable Documentation
permalink: /next/api/manual-row-resize
canonicalUrl: /api/manual-row-resize
editLink: false
---

# ManualRowResize

[[toc]]

## Description

This plugin allows to change rows height. To make rows height persistent the [Options#persistentState](./Options/#persistentState)
plugin should be enabled.

The plugin creates additional components to make resizing possibly using user interface:
- handle - the draggable element that sets the desired height of the row.
- guide - the helper guide that shows the desired height as a horizontal guide.


## Options

### manualRowResize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/dataMap/metaManager/metaSchema.js#L1961

:::

_manualRowResize.manualRowResize : boolean | Array&lt;number&gt;_

Turns on [Manual row resize](https://docs.handsontable.com/demo-resizing.html), if set to a boolean or define initial row resized heights (as an array of heights).

**Default**: <code>undefined</code>  
**Example**  
```js
// as a boolean to enable row resize
manualRowResize: true,

// as an array to set initial heights
// (row at 0 index has 40px and row at 1 index has 50px)
manualRowResize: [40, 50],
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L585

:::

_manualRowResize.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L117

:::

_manualRowResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L88

:::

_manualRowResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L81

:::

_manualRowResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ManualRowResize+enablePlugin) method is called.



### loadManualRowHeights
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L143

:::

_manualRowResize.loadManualRowHeights() ⇒ Array_

Loads the previously saved sizes using the persistentState plugin (the [Options#persistentState](./Options/#persistentState) option
has be enabled).

**Emits**: [`Hooks#event:persistentStateLoad`](./hooks/#persistentStateLoad)  


### saveManualRowHeights
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L132

:::

_manualRowResize.saveManualRowHeights()_

Saves the current sizes using the persistentState plugin (the [Options#persistentState](./Options/#persistentState) option has to be
enabled).

**Emits**: [`Hooks#event:persistentStateSave`](./hooks/#persistentStateSave)  


### setManualSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L158

:::

_manualRowResize.setManualSize(row, height) ⇒ number_

Sets the new height for specified row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| height | `number` | Row height. |


**Returns**: `number` - Returns new height.  

### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8b8649ff4348982784f4521edf84f87bd091a0b3/src/plugins/manualRowResize/manualRowResize.js#L107

:::

_manualRowResize.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



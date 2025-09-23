---
title: DragToScroll
metaTitle: DragToScroll - JavaScript Data Grid | Handsontable
permalink: /api/drag-to-scroll
canonicalUrl: /api/drag-to-scroll
searchCategory: API Reference
hotPlugin: true
editLink: false
id: c3f14467
description: Use the DragToScroll plugin with its API options, members, and methods to scroll the data grid by selecting a cell and dragging it outside the viewport.
react:
  id: uawwix9r
  metaTitle: DragToScroll - React Data Grid | Handsontable
angular:
  id: o5h4q1uv
  metaTitle: DragToScroll - Angular Data Grid | Handsontable
---

# Plugin: DragToScroll

[[toc]]

## Description

Plugin used to scroll Handsontable by selecting a cell and dragging outside of the visible viewport.


## Options

### dragToScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/dataMap/metaManager/metaSchema.js#L1980

:::

_dragToScroll.dragToScroll : boolean_

The `dragToScroll` option configures the [`DragToScroll`](@/api/dragToScroll.md) plugin.

You can set the `dragToScroll` option to one of the following:

| Setting          | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `true` (default) | When selection reaches the edge of the grid's viewport, scroll the viewport |
| `false`          | Don't scroll the viewport                                                   |

Read more:
- [Plugins: `DragToScroll`](@/api/dragToScroll.md)

**Default**: <code>true</code>  
**Example**  
```js
// when selection reaches the edge of the grid's viewport, scroll the viewport
dragToScroll: true,
```

## Members

### boundaries
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L33

:::

_dragToScroll.boundaries : DOMRect_

Size of an element and its position relative to the viewport,
e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.


## Methods

### check
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L128

:::

_dragToScroll.check(x, y)_

Checks if the mouse position (X, Y) is outside the viewport and fires a callback with calculated X an Y diffs
between passed boundaries.


| Param | Type | Description |
| --- | --- | --- |
| x | `number` | Mouse X coordinate to check. |
| y | `number` | Mouse Y coordinate to check. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L253

:::

_dragToScroll.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L91

:::

_dragToScroll.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L62

:::

_dragToScroll.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L55

:::

_dragToScroll.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [DragToScroll#enablePlugin](@/api/dragToScroll.md#enableplugin) method is called.



### setBoundaries
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L103

:::

_dragToScroll.setBoundaries([boundaries])_

Sets the boundaries/dimensions of the scrollable viewport.


| Param | Type | Description |
| --- | --- | --- |
| [boundaries] | `DOMRect` <br/> `Object` | `optional` An object with coordinates. Contains the window boundaries by default. The object is compatible with DOMRect. |



### setCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L117

:::

_dragToScroll.setCallback(callback)_

Changes callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The callback function. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/plugins/dragToScroll/dragToScroll.js#L81

:::

_dragToScroll.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`dragToScroll`](@/api/options.md#dragtoscroll)



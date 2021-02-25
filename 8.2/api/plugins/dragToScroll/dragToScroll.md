---
title: DragToScroll
permalink: /8.2/api/drag-to-scroll
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Plugin used to scroll Handsontable by selecting a cell and dragging outside of the visible viewport.



## Members
### boundaries
`dragToScroll.boundaries : DOMRect`

Size of an element and its position relative to the viewport,
e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.



### isEnabled
`dragToScroll.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#DragToScroll+enablePlugin) method is called.



### enablePlugin
`dragToScroll.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`dragToScroll.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`dragToScroll.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### setBoundaries
`dragToScroll.setBoundaries(boundaries)`

Sets the value of the visible element.


| Param | Type | Description |
| --- | --- | --- |
| boundaries | <code>DOMRect</code> | An object with coordinates compatible with DOMRect. |



### setCallback
`dragToScroll.setCallback(callback)`

Changes callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | The callback function. |



### check
`dragToScroll.check(x, y)`

Checks if the mouse position (X, Y) is outside of the viewport and fires a callback with calculated X an Y diffs
between passed boundaries.


| Param | Type | Description |
| --- | --- | --- |
| x | <code>number</code> | Mouse X coordinate to check. |
| y | <code>number</code> | Mouse Y coordinate to check. |



### destroy
`dragToScroll.destroy()`

Destroys the plugin instance.




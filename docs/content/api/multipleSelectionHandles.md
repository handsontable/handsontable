---
title: MultipleSelectionHandles
metaTitle: MultipleSelectionHandles API reference | Handsontable DataGrid for JavaScript
permalink: /api/multiple-selection-handles
canonicalUrl: /api/multiple-selection-handles
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### dragged

::: ask-about-api dragged|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L500

:::

_multipleSelectionHandles.dragged : Array_



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L126

:::

_MultipleSelectionHandles.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L131

:::

_MultipleSelectionHandles.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### disablePlugin

::: ask-about-api disablePlugin|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L158

:::

_multipleSelectionHandles.disablePlugin()_

Disables the plugin and forgets any drag in progress.

Without the reset, an `updateSettings()` mid-drag would take the listeners away while
`#dragTouches` still reported a drag - and because browsers recycle `Touch.identifier`, a later
unrelated finger handed a stale id would pass `isDraggedBy()` and start scrolling the grid.



### enablePlugin

::: ask-about-api enablePlugin|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L144

:::

_multipleSelectionHandles.enablePlugin()_

Enable plugin for this Handsontable instance.



### getCurrentRangeCoords

::: ask-about-api getCurrentRangeCoords|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L307

:::

_multipleSelectionHandles.getCurrentRangeCoords()_

Calculates the new selection range coordinates after dragging a touch handle, accounting for drag direction and handle position.



### isDragged

::: ask-about-api isDragged|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L471

:::

_multipleSelectionHandles.isDragged() ⇒ boolean_

Check if user is currently dragging the handle.


**Returns**: `boolean` - Dragging state.  

### isEnabled

::: ask-about-api isEnabled|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L139

:::

_multipleSelectionHandles.isEnabled() ⇒ boolean_

Check if the plugin is enabled. There is no setting: the plugin turns on for a mobile
user-agent and for iPadOS that reports a desktop Macintosh UA (iPadOS 13+).



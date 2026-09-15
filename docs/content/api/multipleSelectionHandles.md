---
title: MultipleSelectionHandles
metaTitle: MultipleSelectionHandles API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L499

:::

_multipleSelectionHandles.dragged : Array_



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L126

:::

_MultipleSelectionHandles.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L131

:::

_MultipleSelectionHandles.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### disablePlugin

::: ask-about-api disablePlugin|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L157

:::

_multipleSelectionHandles.disablePlugin()_

Disables the plugin and forgets any drag in progress.

Without the reset, an `updateSettings()` mid-drag would take the listeners away while
`#dragTouches` still reported a drag - and because browsers recycle `Touch.identifier`, a later
unrelated finger handed a stale id would pass `isDraggedBy()` and start scrolling the grid.



### enablePlugin

::: ask-about-api enablePlugin|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L143

:::

_multipleSelectionHandles.enablePlugin()_

Enable plugin for this Handsontable instance.



### getCurrentRangeCoords

::: ask-about-api getCurrentRangeCoords|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L306

:::

_multipleSelectionHandles.getCurrentRangeCoords()_

Calculates the new selection range coordinates after dragging a touch handle, accounting for drag direction and handle position.



### isDragged

::: ask-about-api isDragged|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L470

:::

_multipleSelectionHandles.isDragged() ⇒ boolean_

Check if user is currently dragging the handle.


**Returns**: `boolean` - Dragging state.  

### isEnabled

::: ask-about-api isEnabled|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L138

:::

_multipleSelectionHandles.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



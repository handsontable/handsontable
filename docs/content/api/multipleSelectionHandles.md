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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L340

:::

_multipleSelectionHandles.dragged : Array_



### lastSetCell

::: ask-about-api lastSetCell|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L342

:::

_multipleSelectionHandles.lastSetCell : null_



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L30

:::

_MultipleSelectionHandles.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L35

:::

_MultipleSelectionHandles.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### enablePlugin

::: ask-about-api enablePlugin|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L47

:::

_multipleSelectionHandles.enablePlugin()_

Enable plugin for this Handsontable instance.



### getCurrentRangeCoords

::: ask-about-api getCurrentRangeCoords|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L170

:::

_multipleSelectionHandles.getCurrentRangeCoords()_

Calculates the new selection range coordinates after dragging a touch handle, accounting for drag direction and handle position.



### isDragged

::: ask-about-api isDragged|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L334

:::

_multipleSelectionHandles.isDragged() ⇒ boolean_

Check if user is currently dragging the handle.


**Returns**: `boolean` - Dragging state.  

### isEnabled

::: ask-about-api isEnabled|MultipleSelectionHandles

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/multipleSelectionHandles/multipleSelectionHandles.ts#L42

:::

_multipleSelectionHandles.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



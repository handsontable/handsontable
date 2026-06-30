---
title: DragToScroll
metaTitle: DragToScroll - JavaScript Data Grid | Handsontable
permalink: /api/drag-to-scroll
canonicalUrl: /api/drag-to-scroll
searchCategory: API Reference
hotPlugin: false
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

[[toc]]
## Members

### boundaries

::: ask-about-api boundaries|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L360

:::

_dragToScroll.boundaries : DOMRect_

Size of an element and its position relative to the viewport,
e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.



### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L168

:::

_DragToScroll.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L158

:::

_DragToScroll.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L163

:::

_DragToScroll.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### check

::: ask-about-api check|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L248

:::

_dragToScroll.check(x, y)_

Checks if the mouse position (X, Y) is outside the viewport and fires a callback with calculated X an Y diffs
between passed boundaries.


| Param | Type | Description |
| --- | --- | --- |
| x | `number` | Mouse X coordinate to check. |
| y | `number` | Mouse Y coordinate to check. |



### destroy

::: ask-about-api destroy|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L326

:::

_dragToScroll.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L217

:::

_dragToScroll.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L187

:::

_dragToScroll.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L182

:::

_dragToScroll.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [DragToScroll#enablePlugin](@/api/dragToScroll.md#enableplugin) method is called.



### setBoundaries

::: ask-about-api setBoundaries|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L227

:::

_dragToScroll.setBoundaries([boundaries])_

Sets the boundaries/dimensions of the scrollable viewport.


| Param | Type | Description |
| --- | --- | --- |
| [boundaries] | `DOMRect` <br/> `Object` | `optional` An object with coordinates. Contains the window boundaries by default. The object is compatible with DOMRect. |



### setCallback

::: ask-about-api setCallback|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L239

:::

_dragToScroll.setCallback(callback)_

Changes callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The callback function. |



### updatePlugin

::: ask-about-api updatePlugin|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L210

:::

_dragToScroll.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`dragToScroll`](@/api/options.md#dragtoscroll)



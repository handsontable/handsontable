---
title: ManualRowResize
metaTitle: ManualRowResize - JavaScript Data Grid | Handsontable
permalink: /api/manual-row-resize
canonicalUrl: /api/manual-row-resize
searchCategory: API Reference
hotPlugin: false
editLink: false
id: la7wo1xh
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change row heights using Handsontable's interface.
react:
  id: 7chricz2
  metaTitle: ManualRowResize - React Data Grid | Handsontable
angular:
  id: z4s5b3qr
  metaTitle: ManualRowResize - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and applies CSS classes to the resize handle and guide elements.


## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L154

:::

_ManualRowResize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L159

:::

_ManualRowResize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L472

:::

_manualRowResize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L204

:::

_manualRowResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L178

:::

_manualRowResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getLastDesiredRowHeight

::: ask-about-api getLastDesiredRowHeight|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L249

:::

_manualRowResize.getLastDesiredRowHeight() ⇒ number_

Returns the last desired row height set manually with the resize handle.


**Returns**: `number` - The last desired row height.  

### isEnabled

::: ask-about-api isEnabled|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L173

:::

_manualRowResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualRowResize#enablePlugin](@/api/manualRowResize.md#enableplugin) method is called.



### loadManualRowHeights <span class="tag-deprecated">Deprecated</span>

::: ask-about-api loadManualRowHeights|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L227

:::

_manualRowResize.loadManualRowHeights() ⇒ Array_

::: warning
true
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op and will be removed in a
future major release.



### saveManualRowHeights <span class="tag-deprecated">Deprecated</span>

::: ask-about-api saveManualRowHeights|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L218

:::

_manualRowResize.saveManualRowHeights()_

::: warning
true
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op and will be removed in a
future major release.



### setManualSize

::: ask-about-api setManualSize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L237

:::

_manualRowResize.setManualSize(row, height) ⇒ number_

Sets the new height for specified row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| height | `number` | Row height. |


**Returns**: `number` - Returns new height.  

### updatePlugin

::: ask-about-api updatePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L197

:::

_manualRowResize.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualRowResize`](@/api/options.md#manualrowresize)



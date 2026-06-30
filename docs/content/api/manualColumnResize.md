---
title: ManualColumnResize
metaTitle: ManualColumnResize - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-resize
canonicalUrl: /api/manual-column-resize
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4zjgoamn
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change column widths using Handsontable's interface.
react:
  id: lszzwc0i
  metaTitle: ManualColumnResize - React Data Grid | Handsontable
angular:
  id: x6q3z1mn
  metaTitle: ManualColumnResize - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and applies CSS classes to the resize handle and guide elements.


## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L164

:::

_ManualColumnResize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L169

:::

_ManualColumnResize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearManualSize

::: ask-about-api clearManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L259

:::

_manualColumnResize.clearManualSize(column)_

Clears the cache for the specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### destroy

::: ask-about-api destroy|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L464

:::

_manualColumnResize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L216

:::

_manualColumnResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L188

:::

_manualColumnResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L183

:::

_manualColumnResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnResize#enablePlugin](@/api/manualColumnResize.md#enableplugin) method is called.



### loadManualColumnWidths <span class="tag-deprecated">Deprecated</span>

::: ask-about-api loadManualColumnWidths|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L239

:::

_manualColumnResize.loadManualColumnWidths() ⇒ Array_

::: warning
true
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op and will be removed in a
future major release.



### saveManualColumnWidths <span class="tag-deprecated">Deprecated</span>

::: ask-about-api saveManualColumnWidths|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L230

:::

_manualColumnResize.saveManualColumnWidths()_

::: warning
true
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op and will be removed in a
future major release.



### setManualSize

::: ask-about-api setManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L249

:::

_manualColumnResize.setManualSize(column, width) ⇒ number_

Sets the new width for specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| width | `number` | Column width (no less than 20px). |


**Returns**: `number` - Returns new width.  

### updatePlugin

::: ask-about-api updatePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L209

:::

_manualColumnResize.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnResize`](@/api/options.md#manualcolumnresize)



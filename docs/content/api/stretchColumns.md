---
title: StretchColumns
metaTitle: StretchColumns - JavaScript Data Grid | Handsontable
permalink: /api/stretch-columns
canonicalUrl: /api/stretch-columns
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 9a2z1j1i
description: Use the StretchColumns plugin with its API options and methods to stretch the columns.
react:
  id: a2b7ku2p
  metaTitle: StretchColumns - React Data Grid | Handsontable
angular:
  id: g7z2i0ef
  metaTitle: StretchColumns - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L96

:::

_StretchColumns.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L101

:::

_StretchColumns.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L106

:::

_StretchColumns.SETTING\_KEYS_

Returns whether the plugin handles its own settings keys without a dedicated key list.


## Methods

### destroy

::: ask-about-api destroy|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L155

:::

_stretchColumns.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L140

:::

_stretchColumns.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L122

:::

_stretchColumns.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getColumnWidth

::: ask-about-api getColumnWidth|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L150

:::

_stretchColumns.getColumnWidth(columnVisualIndex) ⇒ number | null_

Gets the calculated column width based on the stretching
strategy defined by [Options#stretchH](@/api/options.md#stretchh) option.


| Param | Type | Description |
| --- | --- | --- |
| columnVisualIndex | `number` | The visual index of the column. |



### isEnabled

::: ask-about-api isEnabled|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L114

:::

_stretchColumns.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [#enablePlugin](#enableplugin) method is called.



### updatePlugin

::: ask-about-api updatePlugin|StretchColumns

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/stretchColumns/stretchColumns.ts#L134

:::

_stretchColumns.updatePlugin()_

Updates the plugin's state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



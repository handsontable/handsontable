---
title: Autofill
metaTitle: Autofill - JavaScript Data Grid | Handsontable
permalink: /api/autofill
canonicalUrl: /api/autofill
searchCategory: API Reference
hotPlugin: false
editLink: false
id: gybdfu49
description: Use the Autofill plugin with its API members and methods to enable the drag-down and copy-down features.
react:
  id: het268ia
  metaTitle: Autofill - React Data Grid | Handsontable
angular:
  id: f2y8u6cd
  metaTitle: Autofill - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L164

:::

_Autofill.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L147

:::

_Autofill.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L152

:::

_Autofill.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L157

:::

_Autofill.SETTING\_KEYS_

Returns the setting keys that trigger a plugin update when changed via `updateSettings`.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L172

:::

_Autofill.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### destroy

::: ask-about-api destroy|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L573

:::

_autofill.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L230

:::

_autofill.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L187

:::

_autofill.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L182

:::

_autofill.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings.



### updatePlugin

::: ask-about-api updatePlugin|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/autofill/autofill.ts#L223

:::

_autofill.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - `autofill`
 - [`fillHandle`](@/api/options.md#fillhandle)



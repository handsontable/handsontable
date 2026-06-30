---
title: Loading
metaTitle: Loading - JavaScript Data Grid | Handsontable
permalink: /api/loading
canonicalUrl: /api/loading
searchCategory: API Reference
hotPlugin: false
editLink: false
id: h2m8p4v9
description: Options, members, and methods of Handsontable's Loading API.
react:
  id: n6k3b8r4
  metaTitle: Loading - React Data Grid | Handsontable
angular:
  id: w7t5x9q2
  metaTitle: Loading - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L142

:::

_Loading.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L132

:::

_Loading.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L137

:::

_Loading.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L152

:::

_Loading.SETTINGS\_VALIDATORS_

Returns an object of validator functions used to type-check each settings property at runtime.


## Methods

### destroy

::: ask-about-api destroy|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L272

:::

_loading.destroy()_

Destroy plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L190

:::

_loading.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L168

:::

_loading.enablePlugin()_

Enable plugin for this Handsontable instance.



### hide

::: ask-about-api hide|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L226

:::

_loading.hide()_

Hide loading dialog.



### isEnabled

::: ask-about-api isEnabled|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L163

:::

_loading.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.



### isVisible

::: ask-about-api isVisible|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L198

:::

_loading.isVisible() ⇒ boolean_

Check if loading dialog is currently visible.



### show

::: ask-about-api show|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L208

:::

_loading.show(options)_

Show loading dialog with optional custom options.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Custom loading options. |
| options.icon | `string` | Custom loading icon. |
| options.title | `string` | Custom loading title. |
| options.description | `string` | Custom loading description. |



### update

::: ask-about-api update|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L244

:::

_loading.update(options)_

Update loading description without hiding/showing the dialog.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Custom loading options. |
| options.icon | `string` | Custom loading icon. |
| options.title | `string` | Custom loading title. |
| options.description | `string` | Custom loading description. |



### updatePlugin

::: ask-about-api updatePlugin|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/loading/loading.ts#L183

:::

_loading.updatePlugin()_

Update plugin state after Handsontable settings update.



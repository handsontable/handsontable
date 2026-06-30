---
title: BindRowsWithHeaders
metaTitle: BindRowsWithHeaders - JavaScript Data Grid | Handsontable
permalink: /api/bind-rows-with-headers
canonicalUrl: /api/bind-rows-with-headers
searchCategory: API Reference
hotPlugin: false
editLink: false
id: dxv2vk3l
description: Use the BindRowsWithHeaders plugin with its API options and methods to allow binding table rows to their headers.
react:
  id: 2mdpwy50
  metaTitle: BindRowsWithHeaders - React Data Grid | Handsontable
angular:
  id: g1z9i5ef
  metaTitle: BindRowsWithHeaders - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L92

:::

_BindRowsWithHeaders.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L97

:::

_BindRowsWithHeaders.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L131

:::

_bindRowsWithHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L125

:::

_bindRowsWithHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L110

:::

_bindRowsWithHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L105

:::

_bindRowsWithHeaders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [BindRowsWithHeaders#enablePlugin](@/api/bindRowsWithHeaders.md#enableplugin) method is called.



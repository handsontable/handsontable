---
title: NestedRows
metaTitle: NestedRows - JavaScript Data Grid | Handsontable
permalink: /api/nested-rows
canonicalUrl: /api/nested-rows
searchCategory: API Reference
hotPlugin: false
editLink: false
id: iadurw6z
description: Use the NestedRows plugin with its API options, members and methods to display data in nested structures (where data spans multiple columns).
react:
  id: fvo6cybt
  metaTitle: NestedRows - React Data Grid | Handsontable
angular:
  id: d0w9f7yz
  metaTitle: NestedRows - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L185

:::

_NestedRows.PLUGIN\_KEY_

Returns the plugin key used to identify and access this plugin within Handsontable.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L190

:::

_NestedRows.PLUGIN\_PRIORITY_

Returns the priority value that determines the plugin's initialization order relative to other plugins.


## Methods

### destroy

::: ask-about-api destroy|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L355

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L239

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L203

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L198

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [NestedRows#enablePlugin](@/api/nestedRows.md#enableplugin) method is called.



### updatePlugin

::: ask-about-api updatePlugin|NestedRows

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/nestedRows/nestedRows.ts#L249

:::

_nestedRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`nestedRows`](@/api/options.md#nestedrows)



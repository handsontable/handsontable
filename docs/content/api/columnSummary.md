---
title: ColumnSummary
metaTitle: ColumnSummary - JavaScript Data Grid | Handsontable
permalink: /api/column-summary
canonicalUrl: /api/column-summary
searchCategory: API Reference
hotPlugin: false
editLink: false
id: wrwu7s6c
description: Use the ColumnSummary plugin with its API options and methods to summarize your columns, using built-in functions or implementing custom summary functions.
react:
  id: 0iw5v2b5
  metaTitle: ColumnSummary - React Data Grid | Handsontable
angular:
  id: j2c9l6kl
  metaTitle: ColumnSummary - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ColumnSummary

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/columnSummary.ts#L117

:::

_ColumnSummary.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ColumnSummary

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/columnSummary.ts#L122

:::

_ColumnSummary.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### disablePlugin

::: ask-about-api disablePlugin|ColumnSummary

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/columnSummary.ts#L172

:::

_columnSummary.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ColumnSummary

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/columnSummary.ts#L135

:::

_columnSummary.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|ColumnSummary

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/columnSummary.ts#L130

:::

_columnSummary.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ColumnSummary#enablePlugin](@/api/columnSummary.md#enableplugin) method is called.



### updatePlugin

::: ask-about-api updatePlugin|ColumnSummary

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/columnSummary/columnSummary.ts#L183

:::

_columnSummary.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`columnSummary`](@/api/options.md#columnsummary)



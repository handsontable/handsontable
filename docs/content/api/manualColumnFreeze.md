---
title: ManualColumnFreeze
metaTitle: ManualColumnFreeze - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-freeze
canonicalUrl: /api/manual-column-freeze
searchCategory: API Reference
hotPlugin: false
editLink: false
id: xn65u35f
description: Use the ManualColumnFreeze plugin with its API options and methods to lock (freeze) the position of specified columns.
react:
  id: 5y6obv03
  metaTitle: ManualColumnFreeze - React Data Grid | Handsontable
angular:
  id: v8o1x9ij
  metaTitle: ManualColumnFreeze - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L107

:::

_ManualColumnFreeze.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L112

:::

_ManualColumnFreeze.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### disablePlugin

::: ask-about-api disablePlugin|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L137

:::

_manualColumnFreeze.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L125

:::

_manualColumnFreeze.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### freezeColumn

::: ask-about-api freezeColumn|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L158

:::

_manualColumnFreeze.freezeColumn(column)_

Freezes the specified column (adds it to fixed columns).

`freezeColumn()` doesn't re-render the table,
so you need to call the `render()` method afterward.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isEnabled

::: ask-about-api isEnabled|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L120

:::

_manualColumnFreeze.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnFreeze#enablePlugin](@/api/manualColumnFreeze.md#enableplugin) method is called.



### unfreezeColumn

::: ask-about-api unfreezeColumn|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L183

:::

_manualColumnFreeze.unfreezeColumn(column)_

Unfreezes the given column (remove it from fixed columns and bring to it's previous position).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### updatePlugin

::: ask-about-api updatePlugin|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L146

:::

_manualColumnFreeze.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze)



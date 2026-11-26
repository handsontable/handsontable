---
title: BindRowsWithHeaders
metaTitle: BindRowsWithHeaders | Handsontable DataGrid for JavaScript
permalink: /api/bind-rows-with-headers
canonicalUrl: /api/bind-rows-with-headers
searchCategory: API Reference
hotPlugin: false
editLink: false
id: dxv2vk3l
description: Use the BindRowsWithHeaders plugin with its API options and methods to allow binding table rows to their headers.
react:
  id: 2mdpwy50
  metaTitle: BindRowsWithHeaders | Handsontable DataGrid for React
angular:
  id: g1z9i5ef
  metaTitle: BindRowsWithHeaders | Handsontable DataGrid for Angular
---

[[toc]]

See the [Row headers](@/guides/rows/row-header/row-header.md) guide for examples and configuration details.

## Options

### bindRowsWithHeaders
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api bindRowsWithHeaders|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L929

:::

_bindRowsWithHeaders.bindRowsWithHeaders : boolean | string_

The `bindRowsWithHeaders` option configures the `BindRowsWithHeaders` plugin.

When enabled, each row stays permanently linked to its row header label, regardless of row sorting or row moving.
Normally, row headers display the visual row index and update as rows are reordered; with this plugin enabled,
the header travels with the data row it was originally assigned to.

You can set the `bindRowsWithHeaders` option to one of the following:

| Setting | Description                                                                  |
| ------- | ---------------------------------------------------------------------------- |
| `false` | Disable the the `BindRowsWithHeaders` plugin |
| `true`  | Enable the the `BindRowsWithHeaders` plugin  |

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

Read more:

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `BindRowsWithHeaders` plugin
bindRowsWithHeaders: true
```

## Members

### LICENSE

::: ask-about-api LICENSE|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L104

:::

_BindRowsWithHeaders.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L93

:::

_BindRowsWithHeaders.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L98

:::

_BindRowsWithHeaders.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L168

:::

_bindRowsWithHeaders.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L132

:::

_bindRowsWithHeaders.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L117

:::

_bindRowsWithHeaders.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|BindRowsWithHeaders

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/bindRowsWithHeaders/bindRowsWithHeaders.ts#L112

:::

_bindRowsWithHeaders.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [BindRowsWithHeaders#enablePlugin](@/api/bindRowsWithHeaders.md#enableplugin) method is called.



---
title: FreezeBar
metaTitle: FreezeBar API reference | Handsontable DataGrid for JavaScript
permalink: /api/freeze-bar
canonicalUrl: /api/freeze-bar
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

See the [Column freezing](@/guides/columns/column-freezing/column-freezing.md) guide for examples and configuration details.

## Options

### freezeBar
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api freezeBar|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5150

:::

_freezeBar.freezeBar : boolean | object_

The `freezeBar` option configures the `FreezeBar` plugin.

The plugin draws a bar on each edge of the frozen area. You drag the bar, or focus it and press the arrow keys,
to change how many rows or columns are frozen. An edge with nothing frozen has a short handle on a corner of
the headers, so users can start freezing from there.

You can set the `freezeBar` option to one of the following:

| Setting   | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `true`    | Enable the `FreezeBar` plugin for rows and columns                  |
| `false`   | Disable the `FreezeBar` plugin                                      |
| An object | Enable the `FreezeBar` plugin and choose the axes                   |

The object form accepts the following properties:

| Property  | Type      | Default | Description                           |
| --------- | --------- | ------- | ------------------------------------- |
| `rows`    | `boolean` | `true`  | Show the bar for frozen rows          |
| `columns` | `boolean` | `true`  | Show the bar for frozen columns       |

The plugin changes the frozen counts on the grid only. It does not write them back to the settings you passed
in, so an application that keeps the counts in its own state copies them in the
[`afterFreezeChange`](@/api/hooks.md#afterfreezechange) hook.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// enable the `FreezeBar` plugin
freezeBar: true,

// enable the `FreezeBar` plugin for columns only
freezeBar: {
  rows: false,
},
```

## Members

### LICENSE

::: ask-about-api LICENSE|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L479

:::

_FreezeBar.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L466

:::

_FreezeBar.PLUGIN\_KEY ⇒ string_

The key of the plugin, which is also the name of its option.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L473

:::

_FreezeBar.PLUGIN\_PRIORITY ⇒ number_

The enable order of the plugin. It enables after the plugins that hide or trim the tracks it measures.


## Methods

### destroy

::: ask-about-api destroy|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L553

:::

_freezeBar.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L512

:::

_freezeBar.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L491

:::

_freezeBar.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getFreezeCount

::: ask-about-api getFreezeCount|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L525

:::

_freezeBar.getFreezeCount(edge) ⇒ number_

Gets the number of frozen rows or columns on the given edge, as configured. It is the count an app saves and the
count the hooks report. The start band has priority over the end band, so the end band is the part of it that
remains. With `limitFixedToViewport` the grid may draw fewer tracks than this: the bar and its ARIA value follow
the drawn count, and there is no public method that returns it.


| Param | Type | Description |
| --- | --- | --- |
| edge | `string` | The edge: `top`, `bottom`, `start` or `end`. |



### isEnabled

::: ask-about-api isEnabled|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L486

:::

_freezeBar.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the settings.



### setFreezeCount

::: ask-about-api setFreezeCount|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L548

:::

_freezeBar.setFreezeCount(edge, count) ⇒ boolean_

Sets the number of frozen rows or columns on the given edge. A count that grows is cut down to what fits the
viewport; a count that stays or shrinks is taken as it is, even when more than that no longer fits.
The change can be canceled in the [Hooks#beforeFreezeChange](@/api/hooks.md#beforefreezechange) hook.


| Param | Type | Description |
| --- | --- | --- |
| edge | `string` | The edge: `top`, `bottom`, `start` or `end`. |
| count | `number` | The new count. |


**Returns**: `boolean` - `true` when the count changed.  

### updatePlugin

::: ask-about-api updatePlugin|FreezeBar

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/freezeBar/freezeBar.ts#L505

:::

_freezeBar.updatePlugin()_

Updates the plugin's state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



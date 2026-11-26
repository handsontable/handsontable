---
title: ManualColumnFreeze
metaTitle: ManualColumnFreeze | Handsontable DataGrid for JavaScript
permalink: /api/manual-column-freeze
canonicalUrl: /api/manual-column-freeze
searchCategory: API Reference
hotPlugin: false
editLink: false
id: xn65u35f
description: Use the ManualColumnFreeze plugin with its API options and methods to lock (freeze) the position of specified columns.
react:
  id: 5y6obv03
  metaTitle: ManualColumnFreeze | Handsontable DataGrid for React
angular:
  id: v8o1x9ij
  metaTitle: ManualColumnFreeze | Handsontable DataGrid for Angular
---

[[toc]]

See the [Column freezing](@/guides/columns/column-freezing/column-freezing.md) guide for examples and configuration details.

## Options

### manualColumnFreeze
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api manualColumnFreeze|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5190

:::

_manualColumnFreeze.manualColumnFreeze : boolean | object_

The `manualColumnFreeze` option configures the `ManualColumnFreeze` plugin.

You can set the `manualColumnFreeze` option to one of the following:

| Setting  | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `true`   | Enable the `ManualColumnFreeze` plugin  |
| `false`  | Disable the `ManualColumnFreeze` plugin |
| An object | Enable the `ManualColumnFreeze` plugin and configure it |

The object form accepts the following property:

| Property                | Type      | Default | Description                                                                                                                                                                  |
| ----------------------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `restoreColumnPosition` | `boolean` | `false` | When `true`, an unfrozen column goes back among the scrollable columns by its data source order: right after the last scrollable column that comes before it in the data source. When `false`, it stays right after the frozen columns. Available since 19.0.0. |

Read more:
- [Column freezing](@/guides/columns/column-freezing/column-freezing.md#user-triggered-freeze)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ManualColumnFreeze` plugin
manualColumnFreeze: true,

// enable the `ManualColumnFreeze` plugin, and move an unfrozen column back by its data source order
manualColumnFreeze: {
  restoreColumnPosition: true,
},
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L104

:::

_ManualColumnFreeze.DEFAULT\_SETTINGS_

Returns the default settings of the plugin, used when `manualColumnFreeze` is set to `true`.



### LICENSE

::: ask-about-api LICENSE|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L99

:::

_ManualColumnFreeze.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L88

:::

_ManualColumnFreeze.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L93

:::

_ManualColumnFreeze.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L111

:::

_ManualColumnFreeze.SETTINGS\_VALIDATORS_

Returns the validators of the object form of the plugin's settings.


## Methods

### enablePlugin

::: ask-about-api enablePlugin|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L126

:::

_manualColumnFreeze.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### freezeColumn

::: ask-about-api freezeColumn|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L162

:::

_manualColumnFreeze.freezeColumn(column)_

Freezes the specified column (adds it to fixed columns).

`freezeColumn()` doesn't re-render the table,
so you need to call the `render()` method afterward.

The method does nothing when the column is already frozen, when it belongs to the `fixedColumnsEnd` band, or,
with the `limitFixedToViewport` option on, when one more frozen column would not fit the grid. The
`afterColumnFreeze` hook then reports that the freeze was not performed.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isEnabled

::: ask-about-api isEnabled|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L121

:::

_manualColumnFreeze.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnFreeze#enablePlugin](@/api/manualColumnFreeze.md#enableplugin) method is called.



### unfreezeColumn

::: ask-about-api unfreezeColumn|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L175

:::

_manualColumnFreeze.unfreezeColumn(column)_

Unfreezes the given column (removes it from fixed columns). The column is placed right after the frozen
columns, or, with the `restoreColumnPosition` setting, back among the scrollable columns in data order.

The method does nothing when the column is not frozen, or when unfreezing it would hand a column to the
`fixedColumnsEnd` band. With the `limitFixedToViewport` option on, a column that the grid draws as scrolling
counts as not frozen, and the new count is the drawn count minus one. The `afterColumnUnfreeze` hook then
reports whether the unfreeze was performed.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### updatePlugin

::: ask-about-api updatePlugin|ManualColumnFreeze

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnFreeze/manualColumnFreeze.ts#L146

:::

_manualColumnFreeze.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze)



---
title: ManualColumnResize
metaTitle: ManualColumnResize | Handsontable DataGrid for JavaScript
permalink: /api/manual-column-resize
canonicalUrl: /api/manual-column-resize
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4zjgoamn
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change column widths using Handsontable DataGrid's interface.
react:
  id: lszzwc0i
  metaTitle: ManualColumnResize | Handsontable DataGrid for React
angular:
  id: x6q3z1mn
  metaTitle: ManualColumnResize | Handsontable DataGrid for Angular
---

[[toc]]

See the [Column widths](@/guides/columns/column-width/column-width.md) guide for examples and configuration details.


## Description

Initializes the plugin and creates the resize gesture.


## Options

### manualColumnResize
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api manualColumnResize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5265

:::

_manualColumnResize.manualColumnResize : boolean | Array&lt;number&gt;_

The `manualColumnResize` option configures the `ManualColumnResize` plugin.

You can set the `manualColumnResize` option to one of the following:

| Setting  | Description                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the `ManualColumnResize` plugin                                                 |
| `false`  | Disable the `ManualColumnResize` plugin                                                |
| An array | - Enable the `ManualColumnResize` plugin<br>- Set initial widths of individual columns |

Read more:
- [Column width: Column stretching](@/guides/columns/column-width/column-width.md#column-stretching)
- [Column width: Column stretching and manual resizing](@/guides/columns/column-width/column-width.md#column-stretching-and-manual-resizing)

When you set initial widths through the array form, those columns are excluded from
[`stretchH`](@/api/options.md#stretchh) redistribution. Only the columns without a pre-defined width are stretched.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `manualColumnResize` plugin
manualColumnResize: true,

// enable the `manualColumnResize` plugin
// set the initial width of column 0 to 40 pixels
// set the initial width of column 1 to 50 pixels
// set the initial width of column 2 to 60 pixels
manualColumnResize: [40, 50, 60],
```

## Members

### LICENSE

::: ask-about-api LICENSE|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L201

:::

_ManualColumnResize.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L178

:::

_ManualColumnResize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L195

:::

_ManualColumnResize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L187

:::

_ManualColumnResize.SETTING\_KEYS ⇒ Array&lt;string&gt;_

Returns the setting keys that trigger a plugin update after an `updateSettings()` call. The
`colWidths` option is listed alongside the plugin's own key, so that re-declaring the column
widths discards the widths kept from earlier manual resizing.


## Methods

### clearManualSize

::: ask-about-api clearManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L368

:::

_manualColumnResize.clearManualSize(column)_

Clears the width stored for the specified column, so the column falls back to the width coming
from the [`colWidths`](@/api/options.md#colwidths) option, or to the built-in default width.
Call `render()` afterwards to repaint the grid.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualColumnResize');

resizePlugin.clearManualSize(0);
hot.render();
```

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### clearManualSizes

::: ask-about-api clearManualSizes|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L383

:::

_manualColumnResize.clearManualSizes()_

Clears the widths stored for every column, so the columns fall back to the widths coming from
the [`colWidths`](@/api/options.md#colwidths) option, or to the built-in default width. Call
`render()` afterwards to repaint the grid.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualColumnResize');

resizePlugin.clearManualSizes();
hot.render();
```


### destroy

::: ask-about-api destroy|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L398

:::

_manualColumnResize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L267

:::

_manualColumnResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L214

:::

_manualColumnResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getManualSize

::: ask-about-api getManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L311

:::

_manualColumnResize.getManualSize(column) ⇒ number | null_

Returns the width set manually for the specified column, or `null` when the column was never
resized by hand and takes its width from elsewhere.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### getManualSizes

::: ask-about-api getManualSizes|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L326

:::

_manualColumnResize.getManualSizes() ⇒ Array&lt;Array&lt;number&gt;&gt;_

Returns every width set manually, as `[physicalColumn, width]` pairs. Physical indexes,
because the map stores them that way: a manually resized column that trimming has taken out
of the visual space still carries its width here, while `getManualSize` cannot reach it.


**Returns**: `Array<Array<number>>` - The stored `[physicalColumn, width]` pairs.  

### isEnabled

::: ask-about-api isEnabled|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L209

:::

_manualColumnResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnResize#enablePlugin](@/api/manualColumnResize.md#enableplugin) method is called.



### setManualSize

::: ask-about-api setManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L302

:::

_manualColumnResize.setManualSize(column, width) ⇒ number_

Sets the new width for the specified visual column index.

This method updates the plugin's internal width map. Call `render()` after `setManualSize()` to repaint the grid.
Values lower than the minimum column width are saved as that minimum. When the column headers render the
menu button ([`dropdownMenu`](@/api/options.md#dropdownmenu) is enabled), the minimum is the icon size plus
the cell's horizontal padding on both sides (`--ht-icon-size + 2 * --ht-cell-horizontal-padding`), so the
button always fits: `32px` in the Main theme, `40px` in Horizon, and `24px` in Classic. In any other grid, and
when the theme doesn't declare those tokens, the minimum is `20px`, which is also the lowest it can be.

Nothing is stored while the plugin is disabled, for a column that does not exist, or for a width
that is not a finite number.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualColumnResize');

resizePlugin.setManualSize(0, 120);
hot.render();
```

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| width | `number` | Column width (no less than the minimum column width). |


**Returns**: `number` - The width after the minimum is applied, also when nothing was stored.  

### setManualSizes

::: ask-about-api setManualSizes|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L351

:::

_manualColumnResize.setManualSizes(sizes)_

Writes a set of manual widths at once, addressed by physical column index — the
counterpart of [ManualColumnResize#getManualSizes](@/api/manualColumnResize.md#getmanualsizes), so a stored set round-trips onto
the same records regardless of trimming or column order. Values lower than the minimum
column width (see [ManualColumnResize#setManualSize](@/api/manualColumnResize.md#setmanualsize)) are saved as that minimum. A pair whose index
is not an integer within the current column count, or whose width is not a finite number, is skipped.
Unlike `setManualSize()`, a numeric string or `null` width is skipped, not converted.
Call `render()` afterwards to repaint the grid.


| Param | Type | Description |
| --- | --- | --- |
| sizes | `Array<Array<number>>` | The `[physicalColumn, width]` pairs to write. |



### updatePlugin

::: ask-about-api updatePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L249

:::

_manualColumnResize.updatePlugin([newSettings])_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnResize`](@/api/options.md#manualcolumnresize)
 - [`colWidths`](@/api/options.md#colwidths)

Passing `colWidths` re-declares the column widths, so the widths kept from earlier manual
resizing are discarded. A grid whose `manualColumnResize` option is an array keeps that array
instead, whether the array arrives in this call or was set when the grid was built.


| Param | Type | Description |
| --- | --- | --- |
| [newSettings] | `object` | `optional` The config object passed to `updateSettings()`. |



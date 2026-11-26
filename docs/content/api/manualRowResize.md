---
title: ManualRowResize
metaTitle: ManualRowResize | Handsontable DataGrid for JavaScript
permalink: /api/manual-row-resize
canonicalUrl: /api/manual-row-resize
searchCategory: API Reference
hotPlugin: false
editLink: false
id: la7wo1xh
description: Use the ManualRowResize plugin with its API options and methods to let your users manually change row heights using Handsontable DataGrid's interface.
react:
  id: 7chricz2
  metaTitle: ManualRowResize | Handsontable DataGrid for React
angular:
  id: z4s5b3qr
  metaTitle: ManualRowResize | Handsontable DataGrid for Angular
---

[[toc]]

See the [Row heights](@/guides/rows/row-height/row-height.md) guide for examples and configuration details.


## Description

Initializes the plugin and creates the resize gesture.


## Options

### manualRowResize
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api manualRowResize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5337

:::

_manualRowResize.manualRowResize : boolean | Array&lt;number&gt;_

The `manualRowResize` option configures the `ManualRowResize` plugin.

You can set the `manualRowResize` option to one of the following:

| Setting  | Description                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `true`   | Enable the `ManualRowResize` plugin                                               |
| `false`  | Disable the `ManualRowResize` plugin                                              |
| An array | - Enable the `ManualRowResize` plugin<br>- Set initial heights of individual rows |

Read more:
- [Row height: Adjust the row height manually](@/guides/rows/row-height/row-height.md#adjust-the-row-height-manually)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ManualRowResize` plugin
manualRowResize: true,

// enable the `ManualRowResize` plugin
// set the initial height of row 0 to 40 pixels
// set the initial height of row 1 to 50 pixels
// set the initial height of row 2 to 60 pixels
manualRowResize: [40, 50, 60],
```

## Members

### LICENSE

::: ask-about-api LICENSE|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L144

:::

_ManualRowResize.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L133

:::

_ManualRowResize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L138

:::

_ManualRowResize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L153

:::

_ManualRowResize.SETTING\_KEYS ⇒ Array&lt;string&gt;_

Returns the setting keys that trigger a plugin update after an `updateSettings()` call. The
`rowHeights` option is listed alongside the plugin's own key, so that re-declaring the row
heights discards the heights kept from earlier manual resizing.


## Methods

### clearManualSize

::: ask-about-api clearManualSize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L316

:::

_manualRowResize.clearManualSize(row)_

Clears the height stored for the specified row, so the row falls back to the height coming from
the [`rowHeights`](@/api/options.md#rowheights) option or from the theme. Call `render()`
afterwards to repaint the grid.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualRowResize');

resizePlugin.clearManualSize(0);
hot.render();
```

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### clearManualSizes

::: ask-about-api clearManualSizes|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L331

:::

_manualRowResize.clearManualSizes()_

Clears the heights stored for every row, so the rows fall back to the heights coming from the
[`rowHeights`](@/api/options.md#rowheights) option or from the theme. Call `render()` afterwards
to repaint the grid.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualRowResize');

resizePlugin.clearManualSizes();
hot.render();
```


### destroy

::: ask-about-api destroy|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L353

:::

_manualRowResize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L220

:::

_manualRowResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L169

:::

_manualRowResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getLastDesiredRowHeight

::: ask-about-api getLastDesiredRowHeight|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L338

:::

_manualRowResize.getLastDesiredRowHeight() ⇒ number_

Returns the last desired row height set manually with the resize handle.


**Returns**: `number` - The last desired row height.  

### getManualSize

::: ask-about-api getManualSize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L260

:::

_manualRowResize.getManualSize(row) ⇒ number | null_

Returns the height set manually for the specified row, or `null` when the row was never
resized by hand and takes its height from elsewhere.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### getManualSizes

::: ask-about-api getManualSizes|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L275

:::

_manualRowResize.getManualSizes() ⇒ Array&lt;Array&lt;number&gt;&gt;_

Returns every height set manually, as `[physicalRow, height]` pairs. Physical indexes,
because the map stores them that way: a manually resized row that trimming has taken out
of the visual space still carries its height here, while `getManualSize` cannot reach it.


**Returns**: `Array<Array<number>>` - The stored `[physicalRow, height]` pairs.  

### isEnabled

::: ask-about-api isEnabled|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L164

:::

_manualRowResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualRowResize#enablePlugin](@/api/manualRowResize.md#enableplugin) method is called.



### setManualSize

::: ask-about-api setManualSize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L251

:::

_manualRowResize.setManualSize(row, height) ⇒ number_

Sets the new height for the specified visual row index.

This method updates the plugin's internal height map. Call `render()` after `setManualSize()` to repaint the grid.
Values lower than the theme's default row height are saved as the default row height.

Nothing is stored while the plugin is disabled, for a row that does not exist, or for a height that
is not a finite number.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualRowResize');

resizePlugin.setManualSize(0, 40);
hot.render();
```

| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| height | `number` | Row height (no less than the theme's default row height). |


**Returns**: `number` - The height after the minimum is applied, also when nothing was stored.  

### setManualSizes

::: ask-about-api setManualSizes|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L299

:::

_manualRowResize.setManualSizes(sizes)_

Writes a set of manual heights at once, addressed by physical row index — the counterpart
of [ManualRowResize#getManualSizes](@/api/manualRowResize.md#getmanualsizes), so a stored set round-trips onto the same
records regardless of trimming or row order. Values lower than the theme's default row
height are saved as that height. A pair whose index is not an integer within the current row
count, or whose height is not a finite number, is skipped. Unlike `setManualSize()`, a numeric
string or `null` height is skipped, not converted. Call `render()` afterwards to repaint the grid.


| Param | Type | Description |
| --- | --- | --- |
| sizes | `Array<Array<number>>` | The `[physicalRow, height]` pairs to write. |



### updatePlugin

::: ask-about-api updatePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L202

:::

_manualRowResize.updatePlugin([newSettings])_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualRowResize`](@/api/options.md#manualrowresize)
 - [`rowHeights`](@/api/options.md#rowheights)

Passing `rowHeights` re-declares the row heights, so the heights kept from earlier manual
resizing are discarded. A grid whose `manualRowResize` option is an array keeps that array
instead, whether the array arrives in this call or was set when the grid was built.


| Param | Type | Description |
| --- | --- | --- |
| [newSettings] | `object` | `optional` The config object passed to `updateSettings()`. |



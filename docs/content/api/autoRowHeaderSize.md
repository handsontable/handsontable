---
title: AutoRowHeaderSize
metaTitle: AutoRowHeaderSize | Handsontable DataGrid for JavaScript
permalink: /api/auto-row-header-size
canonicalUrl: /api/auto-row-header-size
searchCategory: API Reference
hotPlugin: false
editLink: false
id: ty441i4v
description: Use the AutoRowHeaderSize plugin with its API options and methods to set the row header width based on its longest label.
react:
  id: s8rcdjwl
  metaTitle: AutoRowHeaderSize | Handsontable DataGrid for React
angular:
  id: 1iiq9p4n
  metaTitle: AutoRowHeaderSize | Handsontable DataGrid for Angular
---

[[toc]]

See the [Row headers](@/guides/rows/row-header/row-header.md) guide for examples and configuration details.

## Options

### autoRowHeaderSize
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api autoRowHeaderSize|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L7106

:::

_autoRowHeaderSize.autoRowHeaderSize : object | boolean_

The `autoRowHeaderSize` option configures the `AutoRowHeaderSize` plugin.

The plugin sizes the row header column to its widest label, the way
[`AutoColumnSize`](@/api/autoColumnSize.md) sizes a data column to its widest cell. Turning it
on is all you need: it takes the row header's width over, so any
[`rowHeaderWidth`](@/api/options.md#rowheaderwidth) already set is ignored while the plugin is enabled.

You can set the `autoRowHeaderSize` option to one of the following:

| Setting   | Description                                                                  |
| --------- | ---------------------------------------------------------------------------- |
| `false`   | Disable the `AutoRowHeaderSize` plugin          |
| `true`    | Enable the plugin with the default configuration                             |
| An object | Enable the plugin and modify its options                                     |

If you set the `autoRowHeaderSize` option to an object, you can set the following options:

| Property                | Possible values   | Description                                                                                                   |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `samplingRatio`         | A number          | The number of samples of the same label length used in the measurement<br>(default: `3`)                      |
| `allowSampleDuplicates` | `true` \| `false` | When two rows carry the same label:<br>`true`: measure both<br>`false`: measure it once<br>(default: `false`) |
| `syncLimit`             | A number \| a percent string | How many rows are read before the first paint; the rest are read in idle time<br>(default: `500`) |

By default, the `autoRowHeaderSize` option is set to `undefined`, which disables the plugin.

Finding the longest label means reading every row header once. On a large grid that work is
split: the first `syncLimit` rows are read before the first paint, and the rest are read in
the browser's idle time, so a header can widen a moment after the grid appears. While that is
running a header only ever widens, so its width never jumps back and forth. The result is
cached, so later draws cost nothing.

Editing a cell does not re-read the whole grid. Only the rows that changed are read, because
a row header label can be built from cell values, and that reading waits for an idle moment
too. It can make a header wider, but never narrower: a header shrinks again on the next full
pass, which is started by loading or replacing the data, adding or removing a row, sorting,
hiding or showing a row, switching the theme, or a recalculation by the
[`Formulas`](@/api/formulas.md) plugin.

A grid can render more than one row header, by pushing a renderer through the
[`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers) hook. Every one of
them is measured on its own, so each gets exactly the width its own labels need.

The measured width leaves a little room around the longest label, so the text never sits flush
against the cell border. The grid's own row header renderer wraps its label in a padded
element, but a renderer pushed through
[`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers) writes straight into
the cell and has none of its own.

Two rows carrying the same label are measured once, since the same text renders to the same
width. Set `allowSampleDuplicates` to `true` when that is not true of your grid - a row header
that is indented per row, as [`nestedRows`](@/api/options.md#nestedrows) does, renders the same label at a
different width depending on its depth. Raise `samplingRatio` along with it: labels are
grouped by length and only `samplingRatio` of each group are measured, so with the default of
`3` a fourth copy of the same label is still left out, however deep it sits.

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>undefined</code>  
**Since**: 19.0.0  
**Example**  
```js
// size the row header column to its longest label
autoRowHeaderSize: true,

// the same, with the measurement tuned
autoRowHeaderSize: {
  // measure repeated labels too, for headers that render differently per row
  allowSampleDuplicates: true,
},
```

## Members

### CALCULATION_BUDGET

::: ask-about-api CALCULATION_BUDGET|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L374

:::

_AutoRowHeaderSize.CALCULATION\_BUDGET ⇒ number_

Returns how long one idle chunk may spend reading labels, in milliseconds.

A row count alone would be either wasteful or unsafe: reading a label costs well under a
microsecond for the first header level and several times that for each level added through the
hook, so the same number of rows is a rounding error in one grid and a dropped frame in
another. Going by time keeps a chunk inside a frame either way, which matters because
`requestIdleCallback` is missing on some supported browsers - there the chunk runs in an
animation frame instead.



### CALCULATION_STEP

::: ask-about-api CALCULATION_STEP|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L360

:::

_AutoRowHeaderSize.CALCULATION\_STEP ⇒ number_

Returns the number of rows read between two checks of the chunk's time budget.



### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L395

:::

_AutoRowHeaderSize.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.

`null` means "leave it to the sampler", matching how the sibling auto-size plugins express the
same idea. Only settings this plugin actually reads are declared here.



### LICENSE

::: ask-about-api LICENSE|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L338

:::

_AutoRowHeaderSize.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### MEASUREMENT_PADDING

::: ask-about-api MEASUREMENT_PADDING|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L387

:::

_AutoRowHeaderSize.MEASUREMENT\_PADDING ⇒ number_

Returns the breathing space added to every measured level, in pixels.

The ghost table measures the cell exactly as it renders, which is a problem when a row header
renderer writes its text straight into the `th`: the grid's own renderer wraps the label in a
padded element, but a renderer pushed through the hook has no padding at all, so an exact
measurement leaves the longest label flush against the cell border. Rather than require every
renderer to style itself, the width carries a small allowance.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L325

:::

_AutoRowHeaderSize.PLUGIN\_KEY ⇒ string_

The plugin's setting key.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L332

:::

_AutoRowHeaderSize.PLUGIN\_PRIORITY ⇒ number_

The plugin's initialization priority.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L343

:::

_AutoRowHeaderSize.SETTING\_KEYS_

Returns `true` so the plugin updates on every `updateSettings` call, regardless of config object contents.



### SYNC_CALCULATION_LIMIT

::: ask-about-api SYNC_CALCULATION_LIMIT|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L353

:::

_AutoRowHeaderSize.SYNC\_CALCULATION\_LIMIT ⇒ number_

Returns the number of rows read before the first paint, when `syncLimit` says nothing else.

Every existing unit test runs on fewer rows than this, so they measure synchronously and never
have to drive the idle sweep.


## Methods

### clearCache

::: ask-about-api clearCache|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L512

:::

_autoRowHeaderSize.clearCache()_

Throws the measured widths away, so the next read measures again.



### destroy

::: ask-about-api destroy|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L520

:::

_autoRowHeaderSize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L457

:::

_autoRowHeaderSize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L412

:::

_autoRowHeaderSize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getRowHeaderWidth

::: ask-about-api getRowHeaderWidth|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L497

:::

_autoRowHeaderSize.getRowHeaderWidth([headerLevel]) ⇒ number_

Returns the width one row header level needs in order to show its longest label in full.

On a grid larger than `syncLimit` this can still be growing - the rows past that limit are read
in the browser's idle time, so a level can report a wider figure a moment later.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [headerLevel] | `number` | <code>0</code> | `optional` Which row header to report on, counting from the grid's edge:                                 `0` is the first one. The negative column index a row header                                 sits at is accepted too, so `-1` is that same first header and                                 `-2` the one after it. |


**Returns**: `number` - The measured width in pixels, or `0` when there is nothing to measure.  

### getRowHeaderWidths

::: ask-about-api getRowHeaderWidths|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L507

:::

_autoRowHeaderSize.getRowHeaderWidths() ⇒ Array&lt;number&gt;_

Returns the width every row header level needs, in order, starting with the one at the grid's edge.


**Returns**: `Array<number>` - The measured widths in pixels.  

### getSyncCalculationLimit

::: ask-about-api getSyncCalculationLimit|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L469

:::

_autoRowHeaderSize.getSyncCalculationLimit() ⇒ number_

Returns how many rows are read before the first paint.

A plain number is taken as it is, and a percent string is resolved against the row count, the
way [AutoColumnSize](@/api/autoColumnSize.md) resolves its own. Anything else keeps the default, so an object
config that only sets `samplingRatio` still gets a measured first paint.



### isEnabled

::: ask-about-api isEnabled|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L406

:::

_autoRowHeaderSize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings.



### updatePlugin

::: ask-about-api updatePlugin|AutoRowHeaderSize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autoRowHeaderSize/autoRowHeaderSize.ts#L449

:::

_autoRowHeaderSize.updatePlugin([newSettings])_

Updates the plugin's state.


| Param | Type | Description |
| --- | --- | --- |
| [newSettings] | `object` | `optional` The settings passed to `updateSettings`. |



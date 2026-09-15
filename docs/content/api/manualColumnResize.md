---
title: ManualColumnResize
metaTitle: ManualColumnResize - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-resize
canonicalUrl: /api/manual-column-resize
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4zjgoamn
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change column widths using Handsontable's interface.
react:
  id: lszzwc0i
  metaTitle: ManualColumnResize - React Data Grid | Handsontable
angular:
  id: x6q3z1mn
  metaTitle: ManualColumnResize - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and applies CSS classes to the resize handle and guide elements.


## Options

### manualColumnResize

::: ask-about-api manualColumnResize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3920

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

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
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

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L163

:::

_ManualColumnResize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L168

:::

_ManualColumnResize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### clearManualSize

::: ask-about-api clearManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L277

:::

_manualColumnResize.clearManualSize(column)_

Clears the cache for the specified column index.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### destroy

::: ask-about-api destroy|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L484

:::

_manualColumnResize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L221

:::

_manualColumnResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L187

:::

_manualColumnResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L182

:::

_manualColumnResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnResize#enablePlugin](@/api/manualColumnResize.md#enableplugin) method is called.



### loadManualColumnWidths <span class="tag-deprecated">Deprecated</span>

::: ask-about-api loadManualColumnWidths|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L246

:::

_manualColumnResize.loadManualColumnWidths() ⇒ Array_

::: warning
Since 18.0.0. The &#x60;PersistentState&#x60; plugin was removed in 17.0.0, so this method
returns an empty array. It will be removed in 19.0.0. Restore column widths yourself
by passing an array to the &#x60;manualColumnResize&#x60; option.
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.



### saveManualColumnWidths <span class="tag-deprecated">Deprecated</span>

::: ask-about-api saveManualColumnWidths|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L236

:::

_manualColumnResize.saveManualColumnWidths()_

::: warning
Since 18.0.0. The &#x60;PersistentState&#x60; plugin was removed in 17.0.0, so this method
does nothing. It will be removed in 19.0.0. Persist column widths yourself with
the &#x60;afterColumnResize&#x60; hook and the &#x60;manualColumnResize&#x60; option.
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.



### setManualSize

::: ask-about-api setManualSize|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L267

:::

_manualColumnResize.setManualSize(column, width) ⇒ number_

Sets the new width for the specified visual column index.

This method updates the plugin's internal width map. Call `render()` after `setManualSize()` to repaint the grid.
Values lower than `20px` are saved as `20px`.

**Example**  
```js
const resizePlugin = hot.getPlugin('manualColumnResize');

resizePlugin.setManualSize(0, 120);
hot.render();
```

| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| width | `number` | Column width (no less than 20px). |


**Returns**: `number` - Returns new width.  

### updatePlugin

::: ask-about-api updatePlugin|ManualColumnResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualColumnResize/manualColumnResize.ts#L214

:::

_manualColumnResize.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnResize`](@/api/options.md#manualcolumnresize)



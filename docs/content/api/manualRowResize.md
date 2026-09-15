---
title: ManualRowResize
metaTitle: ManualRowResize - JavaScript Data Grid | Handsontable
permalink: /api/manual-row-resize
canonicalUrl: /api/manual-row-resize
searchCategory: API Reference
hotPlugin: false
editLink: false
id: la7wo1xh
description: Use the ManualColumnResize plugin with its API options and methods to let your users manually change row heights using Handsontable's interface.
react:
  id: 7chricz2
  metaTitle: ManualRowResize - React Data Grid | Handsontable
angular:
  id: z4s5b3qr
  metaTitle: ManualRowResize - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and applies CSS classes to the resize handle and guide elements.


## Options

### manualRowResize

::: ask-about-api manualRowResize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3990

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

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
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

### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L153

:::

_ManualRowResize.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L158

:::

_ManualRowResize.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### destroy

::: ask-about-api destroy|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L492

:::

_manualRowResize.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L209

:::

_manualRowResize.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L177

:::

_manualRowResize.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### getLastDesiredRowHeight

::: ask-about-api getLastDesiredRowHeight|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L267

:::

_manualRowResize.getLastDesiredRowHeight() ⇒ number_

Returns the last desired row height set manually with the resize handle.


**Returns**: `number` - The last desired row height.  

### isEnabled

::: ask-about-api isEnabled|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L172

:::

_manualRowResize.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualRowResize#enablePlugin](@/api/manualRowResize.md#enableplugin) method is called.



### loadManualRowHeights <span class="tag-deprecated">Deprecated</span>

::: ask-about-api loadManualRowHeights|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L234

:::

_manualRowResize.loadManualRowHeights() ⇒ Array_

::: warning
Since 18.0.0. The &#x60;PersistentState&#x60; plugin was removed in 17.0.0, so this method
returns an empty array. It will be removed in 19.0.0. Restore row heights yourself
by passing an array to the &#x60;manualRowResize&#x60; option.
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.



### saveManualRowHeights <span class="tag-deprecated">Deprecated</span>

::: ask-about-api saveManualRowHeights|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L224

:::

_manualRowResize.saveManualRowHeights()_

::: warning
Since 18.0.0. The &#x60;PersistentState&#x60; plugin was removed in 17.0.0, so this method
does nothing. It will be removed in 19.0.0. Persist row heights yourself with
the &#x60;afterRowResize&#x60; hook and the &#x60;manualRowResize&#x60; option.
:::
Deprecated. The `PersistentState` plugin has been removed. This method is a no-op.



### setManualSize

::: ask-about-api setManualSize|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L255

:::

_manualRowResize.setManualSize(row, height) ⇒ number_

Sets the new height for the specified visual row index.

This method updates the plugin's internal height map. Call `render()` after `setManualSize()` to repaint the grid.
Values lower than the theme's default row height are saved as the default row height.

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


**Returns**: `number` - Returns new height.  

### updatePlugin

::: ask-about-api updatePlugin|ManualRowResize

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/manualRowResize/manualRowResize.ts#L202

:::

_manualRowResize.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualRowResize`](@/api/options.md#manualrowresize)



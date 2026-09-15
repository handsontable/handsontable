---
title: DragToScroll
metaTitle: DragToScroll - JavaScript Data Grid | Handsontable
permalink: /api/drag-to-scroll
canonicalUrl: /api/drag-to-scroll
searchCategory: API Reference
hotPlugin: false
editLink: false
id: c3f14467
description: Use the DragToScroll plugin with its API options, members, and methods to scroll the data grid by selecting a cell and dragging it outside the viewport.
react:
  id: uawwix9r
  metaTitle: DragToScroll - React Data Grid | Handsontable
angular:
  id: o5h4q1uv
  metaTitle: DragToScroll - Angular Data Grid | Handsontable
---

[[toc]]
## Options

### dragToScroll

::: ask-about-api dragToScroll|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2290

:::

_dragToScroll.dragToScroll : boolean | object_

The `dragToScroll` option configures the `DragToScroll` plugin.

You can set the `dragToScroll` option to one of the following:

| Setting          | Description                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | Enable with default auto-scroll settings                                                                                                    |
| `false`          | Disable the plugin entirely                                                                                                                 |
| Object           | Enable with custom auto-scroll settings (see below)                                                                                        |

When passing an object, the following properties control the auto-scroll speed:

```js
dragToScroll: {
  interval: {
    min: 20,   // Fastest scroll interval in ms (reached at rampDistance)
    max: 500,  // Slowest scroll interval in ms (applied at the viewport edge)
  },
  rampDistance: 120,  // Pixels outside the edge over which speed ramps up
},
```

The viewport scrolls periodically while the mouse pointer stays outside the
viewport edge. Speed follows a logarithmic curve: slow at the edge, fast when
far outside. The active selection (regular drag-select or autofill drag)
extends to follow the scroll.

Read more:

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

**Default**: <code>true</code>  
**Example**  
```js
// Enable with default settings
dragToScroll: true,

// Enable with custom scroll speed
dragToScroll: {
  interval: { min: 60, max: 300 },
  rampDistance: 60,
},

// Disable
dragToScroll: false,
```

## Members

### boundaries

::: ask-about-api boundaries|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L441

:::

_dragToScroll.boundaries : DOMRect_

Size of an element and its position relative to the viewport,
e.g. {bottom: 449, height: 441, left: 8, right: 814, top: 8, width: 806, x: 8, y:8}.



### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L217

:::

_DragToScroll.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L207

:::

_DragToScroll.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L212

:::

_DragToScroll.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### check

::: ask-about-api check|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L299

:::

_dragToScroll.check(x, y)_

Checks if the mouse position (X, Y) is outside the viewport and fires a callback with calculated X an Y diffs
between passed boundaries.


| Param | Type | Description |
| --- | --- | --- |
| x | `number` | Mouse X coordinate to check. |
| y | `number` | Mouse Y coordinate to check. |



### destroy

::: ask-about-api destroy|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L389

:::

_dragToScroll.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L268

:::

_dragToScroll.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L236

:::

_dragToScroll.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L231

:::

_dragToScroll.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [DragToScroll#enablePlugin](@/api/dragToScroll.md#enableplugin) method is called.



### setBoundaries

::: ask-about-api setBoundaries|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L278

:::

_dragToScroll.setBoundaries([boundaries])_

Sets the boundaries/dimensions of the scrollable viewport.


| Param | Type | Description |
| --- | --- | --- |
| [boundaries] | `DOMRect` <br/> `Object` | `optional` An object with coordinates. Contains the window boundaries by default. The object is compatible with DOMRect. |



### setCallback

::: ask-about-api setCallback|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L290

:::

_dragToScroll.setCallback(callback)_

Changes callback function.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The callback function. |



### updatePlugin

::: ask-about-api updatePlugin|DragToScroll

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dragToScroll/dragToScroll.ts#L261

:::

_dragToScroll.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`dragToScroll`](@/api/options.md#dragtoscroll)



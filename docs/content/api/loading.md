---
title: Loading
metaTitle: Loading | Handsontable DataGrid for JavaScript
permalink: /api/loading
canonicalUrl: /api/loading
searchCategory: API Reference
hotPlugin: false
editLink: false
id: h2m8p4v9
description: Options, members, and methods of Handsontable DataGrid's Loading API.
react:
  id: n6k3b8r4
  metaTitle: Loading | Handsontable DataGrid for React
angular:
  id: w7t5x9q2
  metaTitle: Loading | Handsontable DataGrid for Angular
---

[[toc]]

See the [Loading](@/guides/dialog/loading/loading.md) guide for examples and configuration details.

## Options

### loading
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api loading|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L5060

:::

_loading.loading : boolean | object_

The `loading` option configures the `Loading` plugin.

The `Loading` plugin depends on the [`Dialog`](@/api/dialog.md) plugin and turns it
on while `loading` is enabled, so you don't need to set [`dialog: true`](@/api/options.md#dialog). The `dialog`
option itself keeps its value. When you turn `loading` off, the Dialog plugin turns off too, unless
the `dialog` option is set.

You can set the `loading` option to one of the following:

| Setting   | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `false`   | Disable the `Loading` plugin                           |
| `true`    | Enable the `Loading` plugin with default configuration |
| An object | - Enable the `Loading` plugin<br>- Apply custom configuration |

If you set the `loading` option to an object, you can configure the following loading options:

| Option        | Possible settings | Description                                               |
| ------------- | ----------------- | --------------------------------------------------------- |
| `icon`        | A string          | Custom loading icon to display (default: `<svg />`)       |
| `title`       | A string          | Custom loading title to display (default: `'Loading...'`) |
| `description` | A string          | Custom loading description to display (default: `''`)     |

`title` and `description` render as text. Markup passed in them shows up literally rather
than being interpreted, so use `icon` for the one slot that takes markup.

Read more:

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

The loading indicator is available on the main grid only. In a grid nested in a cell, that is a
cell of the
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md),
[`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), or
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type, this
option has no effect.

**Default**: <code>false</code>  
**Since**: 16.1.0  
**Example**  
```js
// enable the `Loading` plugin with default configuration
loading: true,

// enable the `Loading` plugin with custom configuration
loading: {
  icon: 'A custom loading icon in SVG format',
  title: 'Custom loading title',
  description: 'Custom loading description',
}
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L183

:::

_Loading.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L209

:::

_Loading.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L201

:::

_Loading.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L173

:::

_Loading.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L178

:::

_Loading.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L192

:::

_Loading.SETTINGS\_VALIDATORS_

Returns an object of validator functions used to type-check each settings property at runtime.


## Methods

### destroy

::: ask-about-api destroy|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L347

:::

_loading.destroy()_

Destroy plugin instance. The plugin stops requiring the Dialog plugin, so a plugin destroyed ahead of
the grid does not keep Dialog required; the next settings update turns Dialog off unless the `dialog`
option keeps it on. Dialog is not turned off here: during the grid's own teardown its data source is
already gone, and a direct disable would hide the dialog against it.



### disablePlugin

::: ask-about-api disablePlugin|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L263

:::

_loading.disablePlugin()_

Disable plugin for this Handsontable instance. The plugin stops requiring the Dialog plugin, and the
Dialog plugin turns off too unless the `dialog` option keeps it on.



### enablePlugin

::: ask-about-api enablePlugin|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L226

:::

_loading.enablePlugin()_

Enable plugin for this Handsontable instance.



### hide

::: ask-about-api hide|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L313

:::

_loading.hide()_

Hide loading dialog. A dialog the application shows with its own content stays on screen.



### isEnabled

::: ask-about-api isEnabled|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L221

:::

_loading.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.

The loading indicator renders through the Dialog plugin, which is available on the main
Handsontable instance only. In a nested grid (the one the `handsontable`, `autocomplete`, and
`dropdown` cell types create) there is nothing to render into, so the plugin stays disabled
there.



### isVisible

::: ask-about-api isVisible|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L277

:::

_loading.isVisible() ⇒ boolean_

Check if loading dialog is currently visible. A dialog the application shows with its own content does
not count.



### show

::: ask-about-api show|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L288

:::

_loading.show(options)_

Show loading dialog with optional custom options. A dialog the application shows at that moment is
hidden first, and the loading screen takes its place.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Custom loading options. |
| options.icon | `string` | Custom loading icon. |
| options.title | `string` | Custom loading title. |
| options.description | `string` | Custom loading description. |



### update

::: ask-about-api update|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L333

:::

_loading.update(options)_

Update loading description without hiding/showing the dialog. The new options are kept for the next
`show()` when the loading screen is not on screen, and a dialog the application shows is left alone.


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | Custom loading options. |
| options.icon | `string` | Custom loading icon. |
| options.title | `string` | Custom loading title. |
| options.description | `string` | Custom loading description. |



### updatePlugin

::: ask-about-api updatePlugin|Loading

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/loading/loading.ts#L254

:::

_loading.updatePlugin()_

Update plugin state after Handsontable settings update. The plugin stays enabled, so a loading
screen on screen stays there and shows the new options, and no `beforeLoadingHide` or
`afterLoadingHide` fires for it. Turning the option off goes through `disablePlugin()` instead,
which hides the screen.



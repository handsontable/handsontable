---
title: Autofill
metaTitle: Autofill | Handsontable DataGrid for JavaScript
permalink: /api/autofill
canonicalUrl: /api/autofill
searchCategory: API Reference
hotPlugin: false
editLink: false
id: gybdfu49
description: Use the Autofill plugin with its API members and methods to enable the drag-down and copy-down features.
react:
  id: het268ia
  metaTitle: Autofill | Handsontable DataGrid for React
angular:
  id: f2y8u6cd
  metaTitle: Autofill | Handsontable DataGrid for Angular
---

[[toc]]

See the [Autofill values](@/guides/cell-features/autofill-values/autofill-values.md) guide for examples and configuration details.

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L245

:::

_Autofill.DEFAULT\_SETTINGS_

The default values of the [`fillHandle`](@/api/options.md#fillhandle) object form:
`{ direction: undefined, autoInsertRow: true }`.

They fill in each property the option value leaves out (`true`, `'vertical'`, `'horizontal'`, or an
object):
- `direction: undefined`: autofill works in both directions.
- `autoInsertRow: true`: dragging the fill handle below the last row adds new rows.
  `direction: 'horizontal'` turns it off.

If you don't set `fillHandle` at all, the grid's default (`{ autoInsertRow: false }`) goes through
the same merge, so autofill still works in both directions, but no rows are added.

**Example**  
```js
// vertical autofill only; `autoInsertRow` keeps its default, `true`
fillHandle: { direction: 'vertical' },
```


### LICENSE

::: ask-about-api LICENSE|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L216

:::

_Autofill.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L205

:::

_Autofill.PLUGIN\_KEY_

The key the plugin is registered under: `'autofill'`. Pass it to
[Core#getPlugin](@/api/core.md#getplugin) to get the plugin instance: `hot.getPlugin('autofill')`.

The key is not the option name. To turn the plugin on and configure it, use the
[`fillHandle`](@/api/options.md#fillhandle) option.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L210

:::

_Autofill.PLUGIN\_PRIORITY_

The plugin's priority: `20`. Plugins with a lower priority are enabled first.



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L222

:::

_Autofill.SETTING\_KEYS_

The options that update the plugin when you pass them to [Core#updateSettings](@/api/core.md#updatesettings):
`['fillHandle']`.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L253

:::

_Autofill.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### destroy

::: ask-about-api destroy|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L729

:::

_autofill.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L332

:::

_autofill.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L268

:::

_autofill.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L263

:::

_autofill.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings.



### onUpdateSettings

::: ask-about-api onUpdateSettings|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L352

:::

_autofill.onUpdateSettings(newSettings)_

Applies new settings, marking the call so the plugin toggles it causes leave the render to
`updateSettings()`.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | `object` | New set of settings passed to the `updateSettings()` method. |



### updatePlugin

::: ask-about-api updatePlugin|Autofill

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/autofill/autofill.ts#L307

:::

_autofill.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - `autofill`
 - [`fillHandle`](@/api/options.md#fillhandle)



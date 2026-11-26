---
title: EmptyDataState
metaTitle: EmptyDataState | Handsontable DataGrid for JavaScript
permalink: /api/empty-data-state
canonicalUrl: /api/empty-data-state
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4k5m6n7o
description: Options, members, and methods of Handsontable DataGrid's EmptyDataState API.
react:
  id: 2l3m4n5o
  metaTitle: EmptyDataState | Handsontable DataGrid for React
angular:
  id: x8y9z0a1
  metaTitle: EmptyDataState | Handsontable DataGrid for Angular
---

[[toc]]

See the [Empty data state](@/guides/accessories-and-menus/empty-data-state/empty-data-state.md) guide for examples and configuration details.

## Options

### emptyDataState
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api emptyDataState|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L3223

:::

_emptyDataState.emptyDataState : boolean | object_

The `emptyDataState` option configures the `EmptyDataState` plugin.

You can set the `emptyDataState` option to one of the following:

| Setting   | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `false`   | Disable the `EmptyDataState` plugin                     |
| `true`    | Enable the `EmptyDataState` plugin                      |
| An object | Enable the `EmptyDataState` plugin with custom settings |

If you set the `emptyDataState` option to an object, you can configure the following settings:

| Property  | Possible values                    | Description                                         |
| --------  | ---------------------------------- | --------------------------------------------------- |
| `message` | `string` \| `object` \| `function` | Message to display in the empty data state overlay. |

If you set the `message` option to an object, it have following properties:

| Property      | Possible values | Description                                             |
| ------------- | --------------- | ------------------------------------------------------- |
| `title`       | `string`        | Title to display in the empty data state overlay.       |
| `description` | `string`        | Description to display in the empty data state overlay. |
| `buttons`     | `array`         | Buttons to display in the empty data state overlay.     |
| `loading`     | `boolean`       | When `true`, shows a loading spinner (used for server fetch state). |

If you set the `message` option to a function, the `source` argument can be `"unknown"`, `"filters"`, or `"loading"`.
With [Options#dataProvider](@/api/options.md#dataprovider), the `"loading"` branch follows DataProvider fetch hooks (`beforeDataProviderFetch`,
`afterDataProviderFetch`, and related hooks) using the same rules as server-backed loading in the DataProvider plugin.
Internal refetches (for example after column sort or CRUD) set `skipLoading` on [Hooks#beforeDataProviderFetch](@/api/hooks.md#beforedataproviderfetch) so the
EmptyDataState plugin can omit the loading overlay for those requests.

If you set the `buttons` option to an array, each item requires following properties:

| Property   | Possible values          | Description                                                  |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `text`     | `string`                 | Text to display in the button.                        |
| `type`     | 'primary' \| 'secondary' | Type of the button.                                   |
| `callback` | `function`               | Callback function to call when the button is clicked. |

Read more:

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

The empty data state is available on the main grid only. In a grid nested in a cell, that is a
cell of the
[`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md),
[`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), or
[`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md) cell type, this
option has no effect.

**Default**: <code>false</code>  
**Since**: 16.2.0  
**Example**  
```js
// Enable empty data state plugin with default messages
emptyDataState: true,

// Enable empty data state plugin with custom message
emptyDataState: {
  message: 'No data available',
},

// Enable empty data state plugin with custom message and buttons for any source
emptyDataState: {
  message: {
    title: 'No data available',
    description: 'There’s nothing to display yet.',
    buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
  },
},

// Enable empty data state plugin with custom message and buttons for specific source
emptyDataState: {
  message: (source) => {
    switch (source) {
      case "filters":
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
          buttons: [{ text: 'Reset filters', type: 'secondary', callback: () => {} }],
        };
      case "loading":
        return {
          title: 'Loading data',
          description: 'Please wait.',
        };
      default:
        return {
          title: 'No data available',
          description: 'There’s nothing to display yet.',
        };
    }
  },
},
```

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L271

:::

_EmptyDataState.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L266

:::

_EmptyDataState.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L255

:::

_EmptyDataState.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L260

:::

_EmptyDataState.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L278

:::

_EmptyDataState.SETTINGS\_VALIDATORS_

Returns validator functions for each plugin setting to verify their values are valid before applying them.


## Methods

### destroy

::: ask-about-api destroy|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L467

:::

_emptyDataState.destroy()_

Destroy plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L395

:::

_emptyDataState.disablePlugin()_

Disable plugin for this Handsontable instance. The overlay goes away with the plugin's UI, so the
plugin stops reporting it as visible and forgets the selection it kept for the hide. A later enable
then starts from a hidden overlay, and a grid with rows fires no `afterEmptyDataStateHide` and gets
no selection it did not ask for. `updatePlugin()` keeps that state across its own disable and enable,
the loading flag included, so an update of the options made while a fetch runs keeps the loading
overlay up.



### enablePlugin

::: ask-about-api enablePlugin|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L305

:::

_emptyDataState.enablePlugin()_

Enable plugin for this Handsontable instance.



### isEnabled

::: ask-about-api isEnabled|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L300

:::

_emptyDataState.isEnabled() ⇒ boolean_

Check if the plugin is enabled in the handsontable settings.

The empty data state renders into the root grid element and registers a focus scope, and both
belong to the main Handsontable instance. In a nested grid (the one the `handsontable`,
`autocomplete`, and `dropdown` cell types create) neither exists, so the plugin stays disabled
there.



### isVisible

::: ask-about-api isVisible|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L410

:::

_emptyDataState.isVisible() ⇒ boolean_

Check if the plugin is currently visible.



### updatePlugin

::: ask-about-api updatePlugin|EmptyDataState

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/emptyDataState/emptyDataState.ts#L362

:::

_emptyDataState.updatePlugin()_

Update plugin state after Handsontable settings update.



---
title: NestedRows
metaTitle: NestedRows - Plugin - Handsontable Documentation
permalink: /11.1/api/nested-rows
canonicalUrl: /api/nested-rows
hotPlugin: true
editLink: false
---

# NestedRows

[[toc]]

## Description

Plugin responsible for displaying and operating on data sources with nested structures.


## Options

### nestedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/dataMap/metaManager/metaSchema.js#L3024

:::

_nestedRows.nestedRows : boolean_

The `nestedRows` option configures the [`NestedRows`](@/api/nestedRows.md) plugin.

You can set the `nestedRows` option to one of the following:

| Setting           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `false` (default) | Disable the [`NestedRows`](@/api/nestedRows.md) plugin |
| `true`            | Enable the [`NestedRows`](@/api/nestedRows.md) plugin  |

Read more:
- [Plugins: `NestedRows` &#8594;](@/api/nestedRows.md)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `NestedRows` plugin
nestedRows: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L449

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L171

:::

_nestedRows.disableCoreAPIModifiers()_

Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
modifications.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L125

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L180

:::

_nestedRows.enableCoreAPIModifiers()_

Disable the modify hook skipping flag.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L85

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L78

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [NestedRows#enablePlugin](@/api/nestedRows.md#enableplugin) method is called.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0472af66268f29ceb64d1f046b74a05149cffe8d/../handsontable/src/plugins/nestedRows/nestedRows.js#L134

:::

_nestedRows.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



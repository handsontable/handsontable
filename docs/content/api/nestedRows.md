---
title: NestedRows
metaTitle: NestedRows - JavaScript Data Grid | Handsontable
permalink: /api/nested-rows
canonicalUrl: /api/nested-rows
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the NestedRows plugin with its API options, members and methods to display data in nested structures (where data spans multiple columns).
react:
  metaTitle: NestedRows - React Data Grid | Handsontable
---

# NestedRows

[[toc]]

## Description

Plugin responsible for displaying and operating on data sources with nested structures.


## Options

### nestedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/dataMap/metaManager/metaSchema.js#L3213

:::

_nestedRows.nestedRows : boolean_

The `nestedRows` option configures the [`NestedRows`](@/api/nestedRows.md) plugin.

You can set the `nestedRows` option to one of the following:

| Setting           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `false` (default) | Disable the [`NestedRows`](@/api/nestedRows.md) plugin |
| `true`            | Enable the [`NestedRows`](@/api/nestedRows.md) plugin  |

Read more:
- [Plugins: `NestedRows`](@/api/nestedRows.md)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `NestedRows` plugin
nestedRows: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L453

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L175

:::

_nestedRows.disableCoreAPIModifiers()_

Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
modifications.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L126

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L184

:::

_nestedRows.enableCoreAPIModifiers()_

Disable the modify hook skipping flag.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L87

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L80

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [NestedRows#enablePlugin](@/api/nestedRows.md#enableplugin) method is called.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/nestedRows/nestedRows.js#L138

:::

_nestedRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`nestedRows`](@/api/options.md#nestedrows)



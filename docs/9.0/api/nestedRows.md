---
title: NestedRows
metaTitle: NestedRows - Plugin - Handsontable Documentation
permalink: /9.0/api/nested-rows
canonicalUrl: /api/nested-rows
editLink: false
---

# NestedRows

[[toc]]

## Description

Plugin responsible for displaying and operating on data sources with nested structures.


## Options

### nestedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/dataMap/metaManager/metaSchema.js#L3016

:::

_nestedRows.nestedRows : boolean_

Disable or enable the nested rows functionality - displaying nested structures in a two-dimensional data table.

See [quick setup of the Nested rows](@/guides/rows/row-parent-child.md).

**Default**: <code>false</code>  
**Example**  
```js
nestedRows: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L443

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L159

:::

_nestedRows.disableCoreAPIModifiers()_

Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
modifications.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L115

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L168

:::

_nestedRows.enableCoreAPIModifiers()_

Disable the modify hook skipping flag.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L76

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L69

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [enablePlugin](#nestedrows+enableplugin) method is called.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/659ab339a149a32bdd86eea5b599b7eb50c49555/src/plugins/nestedRows/nestedRows.js#L124

:::

_nestedRows.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



---
title: NestedRows
metaTitle: NestedRows - Plugin - Handsontable Documentation
permalink: /10.0/api/nested-rows
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L3098

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L448

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L170

:::

_nestedRows.disableCoreAPIModifiers()_

Enable the modify hook skipping flag - allows retrieving the data from Handsontable without this plugin's
modifications.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L124

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enableCoreAPIModifiers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L179

:::

_nestedRows.enableCoreAPIModifiers()_

Disable the modify hook skipping flag.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L85

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L78

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [NestedRows#enablePlugin](@/api/nestedRows.md#enableplugin) method is called.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/nestedRows/nestedRows.js#L133

:::

_nestedRows.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



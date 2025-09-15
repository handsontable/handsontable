---
title: NestedRows
metaTitle: NestedRows - JavaScript Data Grid | Handsontable
permalink: /api/nested-rows
canonicalUrl: /api/nested-rows
searchCategory: API Reference
hotPlugin: true
editLink: false
id: iadurw6z
description: Use the NestedRows plugin with its API options, members and methods to display data in nested structures (where data spans multiple columns).
react:
  id: fvo6cybt
  metaTitle: NestedRows - React Data Grid | Handsontable
angular:
  id: d0w9f7yz
  metaTitle: NestedRows - Angular Data Grid | Handsontable
---

# Plugin: NestedRows

[[toc]]

## Description

Plugin responsible for displaying and operating on data sources with nested structures.


## Options

### nestedRows
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/dataMap/metaManager/metaSchema.js#L3633

:::

_nestedRows.nestedRows : boolean_

The `nestedRows` option configures the [`NestedRows`](@/api/nestedRows.md) plugin.

You can set the `nestedRows` option to one of the following:

| Setting           | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `false` (default) | Disable the [`NestedRows`](@/api/nestedRows.md) plugin |
| `true`            | Enable the [`NestedRows`](@/api/nestedRows.md) plugin  |

Read more:
- [Plugins: `NestedRows`](@/guides/rows/row-parent-child/row-parent-child.md)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `NestedRows` plugin
nestedRows: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/nestedRows/nestedRows.js#L485

:::

_nestedRows.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/nestedRows/nestedRows.js#L127

:::

_nestedRows.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/nestedRows/nestedRows.js#L86

:::

_nestedRows.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/nestedRows/nestedRows.js#L79

:::

_nestedRows.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [NestedRows#enablePlugin](@/api/nestedRows.md#enableplugin) method is called.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/nestedRows/nestedRows.js#L140

:::

_nestedRows.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`nestedRows`](@/api/options.md#nestedrows)



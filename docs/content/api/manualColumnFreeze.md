---
title: ManualColumnFreeze
metaTitle: ManualColumnFreeze - JavaScript Data Grid | Handsontable
permalink: /api/manual-column-freeze
canonicalUrl: /api/manual-column-freeze
searchCategory: API Reference
hotPlugin: true
editLink: false
id: xn65u35f
description: Use the ManualColumnFreeze plugin with its API options and methods to lock (freeze) the position of specified columns.
react:
  id: 5y6obv03
  metaTitle: ManualColumnFreeze - React Data Grid | Handsontable
---

# ManualColumnFreeze

[[toc]]

## Description

This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu or using API.
You can turn it on by setting a [Options#manualColumnFreeze](@/api/options.md#manualcolumnfreeze) property to `true`.

**Example**  
```js
// Enables the plugin
manualColumnFreeze: true,
```

## Options

### manualColumnFreeze
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/dataMap/metaManager/metaSchema.js#L2809

:::

_manualColumnFreeze.manualColumnFreeze : boolean_

The `manualColumnFreeze` option configures the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin.

You can set the `manualColumnFreeze` option to one of the following:

| Setting  | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `true`   | Enable the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin  |
| `false`  | Disable the [`ManualColumnFreeze`](@/api/manualColumnFreeze.md) plugin |

Read more:
- [Column freezing](@/guides/columns/column-freezing.md#user-triggered-freeze)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ManualColumnFreeze` plugin
manualColumnFreeze: true,
```

## Methods

### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L75

:::

_manualColumnFreeze.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L61

:::

_manualColumnFreeze.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### freezeColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L102

:::

_manualColumnFreeze.freezeColumn(column)_

Freezes the specified column (adds it to fixed columns).

`freezeColumn()` doesn't re-render the table,
so you need to call the `render()` method afterward.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L54

:::

_manualColumnFreeze.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ManualColumnFreeze#enablePlugin](@/api/manualColumnFreeze.md#enableplugin) method is called.



### unfreezeColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L136

:::

_manualColumnFreeze.unfreezeColumn(column)_

Unfreezes the given column (remove it from fixed columns and bring to it's previous position).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/9896296c44a2eec25879741d9cd62f4038ef8cf7/handsontable/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L87

:::

_manualColumnFreeze.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`manualColumnFreeze`](@/api/options.md#manualcolumnfreeze)


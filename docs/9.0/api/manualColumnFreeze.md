---
title: ManualColumnFreeze
metaTitle: ManualColumnFreeze - Plugin - Handsontable Documentation
permalink: /9.0/api/manual-column-freeze
canonicalUrl: /api/manual-column-freeze
editLink: false
---

# ManualColumnFreeze

[[toc]]

## Description

This plugin allows to manually "freeze" and "unfreeze" a column using an entry in the Context Menu or using API.
You can turn it on by setting a [Options#manualColumnFreeze](@/api/metaSchema.md#manualcolumnfreeze) property to `true`.

**Example**  
```js
// Enables the plugin
manualColumnFreeze: true,
```

## Options

### manualColumnFreeze
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/dataMap/metaManager/metaSchema.js#L2159

:::

_manualColumnFreeze.manualColumnFreeze : boolean_

Disables or enables [ManualColumnFreeze](@/api/manualColumnFreeze.md) plugin.

**Default**: <code>undefined</code>  
**Example**  
```js
// enable fixed columns
manualColumnFreeze: true,
```

## Methods

### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L69

:::

_manualColumnFreeze.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L55

:::

_manualColumnFreeze.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### freezeColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L92

:::

_manualColumnFreeze.freezeColumn(column)_

Freezes the given column (add it to fixed columns).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L48

:::

_manualColumnFreeze.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/pluginHooks.md#beforeinit)
hook and if it returns `true` than the [ManualColumnFreeze#enablePlugin](@/api/manualColumnFreeze.md#enableplugin) method is called.



### unfreezeColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L114

:::

_manualColumnFreeze.unfreezeColumn(column)_

Unfreezes the given column (remove it from fixed columns and bring to it's previous position).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/4d56e68f9cb6412b841663278b2e0eb3ad181233/src/plugins/manualColumnFreeze/manualColumnFreeze.js#L80

:::

_manualColumnFreeze.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



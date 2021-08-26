---
title: DynamicCellMetaMod
metaTitle: DynamicCellMetaMod - API Reference - Handsontable Documentation
permalink: /8.0/api/dynamic-cell-meta-mod
canonicalUrl: /api/dynamic-cell-meta-mod
hotPlugin: false
editLink: false
---

# DynamicCellMetaMod

[[toc]]
## Members

### metaManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/dataMap/metaManager/mods/dynamicCellMeta.js#L25

:::

_dynamicCellMetaMod.metaManager : MetaManager_



### metaSyncMemo
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/dataMap/metaManager/mods/dynamicCellMeta.js#L29

:::

_dynamicCellMetaMod.metaSyncMemo : Map_


## Methods

### extendCellMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/dataMap/metaManager/mods/dynamicCellMeta.js#L51

:::

_dynamicCellMetaMod.extendCellMeta(cellMeta)_

Extends the cell meta object by user-specific properties.

The cell meta object can be extended dynamically,
either by Handsontable's hooks (`beforeGetCellMeta` and`afterGetCellMeta`),
or by Handsontable's `cells` option.

To boost performance, the extending process is triggered only once per one slow Handsontable render cycle.


| Param | Type | Description |
| --- | --- | --- |
| cellMeta | `object` | The cell meta object. |



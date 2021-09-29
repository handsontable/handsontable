---
title: ConditionUpdateObserver
metaTitle: ConditionUpdateObserver - Plugin - Handsontable Documentation
permalink: /10.0/api/condition-update-observer
canonicalUrl: /api/condition-update-observer
hotPlugin: true
editLink: false
---

# ConditionUpdateObserver

[[toc]]

## Description

Class which is designed for observing changes in condition collection. When condition is changed by user at specified
column it's necessary to update all conditions defined after this edited one.

Object fires `update` hook for every column conditions change.


## Members

### changes
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L44

:::

_conditionUpdateObserver.changes : Array_

Collected changes when grouping is enabled.

**Default**: <code>[]</code>  


### columnDataFactory
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L37

:::

_conditionUpdateObserver.columnDataFactory : function_

Function which provide source data factory for specified column.



### conditionCollection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L31

:::

_conditionUpdateObserver.conditionCollection : [ConditionCollection](@/api/conditionCollection.md)_

Reference to the instance of [ConditionCollection](@/api/conditionCollection.md).



### grouping
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L50

:::

_conditionUpdateObserver.grouping : boolean_

Flag which determines if grouping events is enabled.



### hot
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L25

:::

_conditionUpdateObserver.hot : [Core](@/api/core.md)_

Handsontable instance.



### latestEditedColumnPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L57

:::

_conditionUpdateObserver.latestEditedColumnPosition : number_

The latest known position of edited conditions at specified column index.

**Default**: <code>-1</code>  


### latestOrderStack
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L63

:::

_conditionUpdateObserver.latestOrderStack : Array_

The latest known order of conditions stack.


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L198

:::

_conditionUpdateObserver.destroy()_

Destroy instance.



### flush
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L84

:::

_conditionUpdateObserver.flush()_

Flush all collected changes. This trigger `update` hook for every previously collected change from condition collection.



### groupChanges
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L77

:::

_conditionUpdateObserver.groupChanges()_

Enable grouping changes. Grouping is helpful in situations when a lot of conditions is added in one moment. Instead of
trigger `update` hook for every condition by adding/removing you can group this changes and call `flush` method to trigger
it once.



### updateStatesAtColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/conditionUpdateObserver.js#L111

:::

_conditionUpdateObserver.updateStatesAtColumn(column, conditionArgsChange)_

Update all related states which should be changed after invoking changes applied to current column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The column index. |
| conditionArgsChange | `object` | Object describing condition changes which can be handled by filters on `update` hook. It contains keys `conditionKey` and `conditionValue` which refers to change specified key of condition to specified value based on referred keys. |



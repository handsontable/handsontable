---
title: ConditionUpdateObserver
metaTitle: ConditionUpdateObserver API reference – JavaScript Data Grid | Handsontable
permalink: /api/condition-update-observer
canonicalUrl: /api/condition-update-observer
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Class which is designed for observing changes in condition collection. When condition is changed by user at specified
column it's necessary to update all conditions defined after this edited one.

Object fires `update` hook for every column conditions change.



## Description

Initializes the observer with the Handsontable instance, a condition collection to watch, and an optional factory for column source data.


## Members

### changes

::: ask-about-api changes|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L156

:::

_conditionUpdateObserver.changes : Array_

Collected changes when grouping is enabled.

**Default**: <code>[]</code>  


### grouping

::: ask-about-api grouping|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L161

:::

_conditionUpdateObserver.grouping : boolean_

Flag which determines if grouping events is enabled.



### latestEditedColumnPosition

::: ask-about-api latestEditedColumnPosition|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L167

:::

_conditionUpdateObserver.latestEditedColumnPosition : number_

The latest known position of edited conditions at specified column index.

**Default**: <code>-1</code>  


### latestOrderStack

::: ask-about-api latestOrderStack|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L172

:::

_conditionUpdateObserver.latestOrderStack : Array_

The latest known order of conditions stack.


## Methods

### destroy

::: ask-about-api destroy|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L139

:::

_conditionUpdateObserver.destroy()_

Destroy instance.



### flush

::: ask-about-api flush|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L70

:::

_conditionUpdateObserver.flush()_

Flush all collected changes. This trigger `update` hook for every previously collected change from condition collection.



### groupChanges

::: ask-about-api groupChanges|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L65

:::

_conditionUpdateObserver.groupChanges()_

Enable grouping changes. Grouping is helpful in situations when a lot of conditions is added in one moment. Instead of
trigger `update` hook for every condition by adding/removing you can group this changes and call `flush` method to trigger
it once.



### updateStatesAtColumn

::: ask-about-api updateStatesAtColumn|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L84

:::

_conditionUpdateObserver.updateStatesAtColumn(column, conditionArgsChange)_

Update all related states which should be changed after invoking changes applied to current column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The column index. |
| conditionArgsChange | `object` | Object describing condition changes which can be handled by filters on `update` hook. It contains keys `conditionKey` and `conditionValue` which refers to change specified key of condition to specified value based on referred keys. |



---
title: ConditionUpdateObserver
metaTitle: ConditionUpdateObserver API reference | Handsontable DataGrid for JavaScript
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

Initializes the observer with the Handsontable instance, a condition collection to watch, an optional factory for
column source data, and an optional function that adjusts the rows matching the conditions.


## Members

### changes

::: ask-about-api changes|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L195

:::

_conditionUpdateObserver.changes : Array_

Collected changes when grouping is enabled.

**Default**: <code>[]</code>  


### grouping

::: ask-about-api grouping|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L200

:::

_conditionUpdateObserver.grouping : boolean_

Flag which determines if grouping events is enabled.



### latestEditedColumnPosition

::: ask-about-api latestEditedColumnPosition|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L206

:::

_conditionUpdateObserver.latestEditedColumnPosition : number_

The latest known position of edited conditions at specified column index.

**Default**: <code>-1</code>  


### latestOrderStack

::: ask-about-api latestOrderStack|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L211

:::

_conditionUpdateObserver.latestOrderStack : Array_

The latest known order of conditions stack.


## Methods

### destroy

::: ask-about-api destroy|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L165

:::

_conditionUpdateObserver.destroy()_

Destroy instance.



### flush

::: ask-about-api flush|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L138

:::

_conditionUpdateObserver.flush()_

Flush all collected changes. This trigger `update` hook for every previously collected change from condition collection.



### groupChanges

::: ask-about-api groupChanges|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L133

:::

_conditionUpdateObserver.groupChanges()_

Enable grouping changes. Grouping is helpful in situations when a lot of conditions is added in one moment. Instead of
trigger `update` hook for every condition by adding/removing you can group this changes and call `flush` method to trigger
it once.



### updateStatesAtColumn

::: ask-about-api updateStatesAtColumn|ConditionUpdateObserver

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/filters/conditionUpdateObserver.ts#L154

:::

_conditionUpdateObserver.updateStatesAtColumn(column, [_conditionArgsChange])_

Update all related states which should be changed after invoking changes applied to current column.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The column index. |
| [_conditionArgsChange] | `*` | `optional` No longer used. A data change used to hand its value set in here, which is what rewrote the column's condition behind the user's back (issue #6471). The parameter is kept so the published typings keep accepting the old two-argument call. |



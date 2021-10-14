---
title: AggregatedCollection
metaTitle: AggregatedCollection - API Reference - Handsontable Documentation
permalink: /10.0/api/aggregated-collection
canonicalUrl: /api/aggregated-collection
hotPlugin: false
editLink: false
---

# AggregatedCollection

[[toc]]
## Members

| Cell type                                                         | Renderer, editor & validator                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A [custom cell type](@/guides/cell-types/cell-type.md)            | Renderer: your [custom cell renderer](@/guides/cell-functions/cell-renderer.md)<br>Editor: your [custom cell editor](@/guides/cell-functions/cell-editor.md)<br>Validator: your [custom cell validator](@/guides/cell-functions/cell-validator.md) |
| [`'autocomplete'`](@/guides/cell-types/autocomplete-cell-type.md) | Renderer: `Handsontable.renderers.AutocompleteRenderer`<br>Editor: `Handsontable.editors.AutocompleteEditor`<br>Validator: `Handsontable.validators.AutocompleteValidator`                                                                         |
| [`'checkbox'`](@/guides/cell-types/checkbox-cell-type.md)         | Renderer: `Handsontable.renderers.CheckboxRenderer`<br>Editor: `Handsontable.editors.CheckboxEditor`<br>Validator: -                                                                                                                               |
| [`'date'`](@/guides/cell-types/date-cell-type.md)                 | Renderer: `Handsontable.renderers.DateRenderer`<br>Editor: `Handsontable.editors.DateEditor`<br>Validator: `Handsontable.validators.DateValidator`                                                                                                 |
| [`'dropdown'`](@/guides/cell-types/dropdown-cell-type.md)         | Renderer: `Handsontable.renderers.DropdownRenderer`<br>Editor: `Handsontable.editors.DropdownEditor`<br>Validator: `Handsontable.validators.DropdownValidator`                                                                                     |
| [`'handsontable'`](@/guides/cell-types/handsontable-cell-type.md) | Renderer: `Handsontable.renderers.AutocompleteRenderer`<br>Editor: `Handsontable.editors.HandsontableEditor`<br>Validator: -                                                                                                                       |
| [`'numeric'`](@/guides/cell-types/numeric-cell-type.md)           | Renderer: `Handsontable.renderers.NumericRenderer`<br>Editor: `Handsontable.editors.NumericEditor`<br>Validator: `Handsontable.validators.NumericValidator`                                                                                        |
| [`'password'`](@/guides/cell-types/password-cell-type.md)         | Renderer: `Handsontable.renderers.PasswordRenderer`<br>Editor: `Handsontable.editors.PasswordEditor`<br>Validator: -                                                                                                                               |
| `'text'`                                                          | Renderer: `Handsontable.renderers.TextRenderer`<br>Editor: `Handsontable.editors.TextEditor`<br>Validator: -                                                                                                                                       |
| [`'time`'](@/guides/cell-types/time-cell-type.md)                 | Renderer: `Handsontable.renderers.TimeRenderer`<br>Editor: `Handsontable.editors.TimeEditor`<br>Validator: `Handsontable.validators.TimeValidator`                                                                                                 |

### aggregationFunction

::: source-code-link https://github.com/handsontable/handsontable/blob/8fefd4e3b0aa3b030c1cc59eabc183d8e1049360/src/translations/mapCollections/aggregatedCollection.js#L21

:::

_aggregatedCollection.aggregationFunction_

Function which do aggregation on the values for particular index.



### fallbackValue

::: source-code-link https://github.com/handsontable/handsontable/blob/8fefd4e3b0aa3b030c1cc59eabc183d8e1049360/src/translations/mapCollections/aggregatedCollection.js#L25

:::

_aggregatedCollection.fallbackValue_

Fallback value when there is no calculated value for particular index.



### mergedValuesCache

::: source-code-link https://github.com/handsontable/handsontable/blob/8fefd4e3b0aa3b030c1cc59eabc183d8e1049360/src/translations/mapCollections/aggregatedCollection.js#L17

:::

_aggregatedCollection.mergedValuesCache : Array_

List of merged values. Value for each index is calculated using values inside registered maps.


## Methods

### getMergedValueAtIndex

::: source-code-link https://github.com/handsontable/handsontable/blob/8fefd4e3b0aa3b030c1cc59eabc183d8e1049360/src/translations/mapCollections/aggregatedCollection.js#L92

:::

_aggregatedCollection.getMergedValueAtIndex(index, [readFromCache]) ⇒ \*_

Get merged value for particular index.


| Param           | Type      | Default           | Description                                          |
| --------------- | --------- | ----------------- | ---------------------------------------------------- |
| index           | `number`  |                   | Index for which we calculate single result.          |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read results from the cache. |



### getMergedValues

::: source-code-link https://github.com/handsontable/handsontable/blob/8fefd4e3b0aa3b030c1cc59eabc183d8e1049360/src/translations/mapCollections/aggregatedCollection.js#L34

:::

_aggregatedCollection.getMergedValues([readFromCache]) ⇒ Array_

Get merged values for all indexes.


| Param           | Type      | Default           | Description                                          |
| --------------- | --------- | ----------------- | ---------------------------------------------------- |
| [readFromCache] | `boolean` | <code>true</code> | `optional` Determine if read results from the cache. |



### updateCache

::: source-code-link https://github.com/handsontable/handsontable/blob/8fefd4e3b0aa3b030c1cc59eabc183d8e1049360/src/translations/mapCollections/aggregatedCollection.js#L101

:::

_aggregatedCollection.updateCache()_

Rebuild cache for the collection.

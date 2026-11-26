---
title: BooleanMap
metaTitle: BooleanMap API reference | Handsontable DataGrid for JavaScript
permalink: /api/boolean-map
canonicalUrl: /api/boolean-map
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Initializes the boolean map with a default value or factory (defaults to `false`).


## Methods

### destroy

::: ask-about-api destroy|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L268

:::

_booleanMap.destroy()_

Destroys the map instance.



### getLength

::: ask-about-api getLength|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L131

:::

_booleanMap.getLength() ⇒ number_

Get the number of indexes.



### getValueAtIndex

::: ask-about-api getValueAtIndex|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L118

:::

_booleanMap.getValueAtIndex(index) ⇒ T | undefined_

Get the boolean value at a physical index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Physical index. |



### getValues

::: ask-about-api getValues|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L107

:::

_booleanMap.getValues() ⇒ Array&lt;boolean&gt;_

Get the full list of boolean values. Returns the materialized array by reference (no per-call copy).



### isAllDefault

::: ask-about-api isAllDefault|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L100

:::

_booleanMap.isAllDefault() ⇒ boolean_

Tells whether every value equals the default, so no array is materialized. A snapshot reads this
to record the state without calling `getValues()`, which would allocate an n-element array.



### setValueAtIndex

::: ask-about-api setValueAtIndex|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L166

:::

_booleanMap.setValueAtIndex(index, value) ⇒ boolean_

Set the boolean value at a single physical index. Materializes the store on the first non-default write.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Physical index. |
| value | `*` | The value to set (coerced to boolean). |



### setValues

::: ask-about-api setValues|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/translations/maps/booleanMap.ts#L138

:::

_booleanMap.setValues(values)_

Set new boolean values. Keeps the compact representation when all values equal the default.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of boolean values. |



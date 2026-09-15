---
title: BooleanMap
metaTitle: BooleanMap API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/booleanMap.ts#L260

:::

_booleanMap.destroy()_

Destroys the map instance.



### getLength

::: ask-about-api getLength|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/booleanMap.ts#L123

:::

_booleanMap.getLength() ⇒ number_

Get the number of indexes.



### getValueAtIndex

::: ask-about-api getValueAtIndex|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/booleanMap.ts#L110

:::

_booleanMap.getValueAtIndex(index) ⇒ T | undefined_

Get the boolean value at a physical index.


| Param | Type | Description |
| --- | --- | --- |
| index | `number` | Physical index. |



### getValues

::: ask-about-api getValues|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/booleanMap.ts#L99

:::

_booleanMap.getValues() ⇒ Array&lt;boolean&gt;_

Get the full list of boolean values. Returns the materialized array by reference (no per-call copy).



### setValueAtIndex

::: ask-about-api setValueAtIndex|BooleanMap

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/booleanMap.ts#L158

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/translations/maps/booleanMap.ts#L130

:::

_booleanMap.setValues(values)_

Set new boolean values. Keeps the compact representation when all values equal the default.


| Param | Type | Description |
| --- | --- | --- |
| values | `Array` | List of boolean values. |



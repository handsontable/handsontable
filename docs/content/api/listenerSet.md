---
title: ListenerSet
metaTitle: ListenerSet API reference | Handsontable DataGrid for JavaScript
permalink: /api/listener-set
canonicalUrl: /api/listener-set
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Methods

### add

::: ask-about-api add|ListenerSet

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L190

:::

_listenerSet.add(listener) ⇒ function_

Registers a listener.


| Param | Type | Description |
| --- | --- | --- |
| listener | `function` | The listener to add. |


**Returns**: `function` - Unsubscribe function.  

### clear

::: ask-about-api clear|ListenerSet

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L209

:::

_listenerSet.clear()_

Removes every registered listener.



### emit

::: ask-about-api emit|ListenerSet

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/formulaBuilder/formulaBuilder.ts#L200

:::

_listenerSet.emit(...args)_

Invokes every registered listener.


| Param | Type | Description |
| --- | --- | --- |
| ...args | `unknown` | The listener arguments. |



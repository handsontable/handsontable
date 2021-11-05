---
title: HooksRefRegisterer
metaTitle: HooksRefRegisterer - API Reference - Handsontable Documentation
permalink: /11.0/api/hooks-ref-registerer
canonicalUrl: /api/hooks-ref-registerer
hotPlugin: false
editLink: false
---

# HooksRefRegisterer

[[toc]]
## Members

### _hooksStorage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/mixins/hooksRefRegisterer.js#L15

:::

_hooksRefRegisterer.\_hooksStorage_

Internal hooks storage.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/mixins/hooksRefRegisterer.js#L24

:::

_hooksRefRegisterer.addHook(key, callback) ⇒ object_

Add hook to the collection.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |
| callback | `function` | The hook callback. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/mixins/hooksRefRegisterer.js#L49

:::

_hooksRefRegisterer.clearHooks()_

Clear all added hooks.



### removeHooksByKey
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/mixins/hooksRefRegisterer.js#L40

:::

_hooksRefRegisterer.removeHooksByKey(key)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |



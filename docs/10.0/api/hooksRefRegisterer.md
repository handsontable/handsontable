---
title: HooksRefRegisterer
metaTitle: HooksRefRegisterer - API Reference - Handsontable Documentation
permalink: /10.0/api/hooks-ref-registerer
canonicalUrl: /api/hooks-ref-registerer
hotPlugin: false
editLink: false
---

# HooksRefRegisterer

[[toc]]
## Members

### _hooksStorage
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/hooksRefRegisterer.js#L15

:::

_hooksRefRegisterer.\_hooksStorage_

Internal hooks storage.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/hooksRefRegisterer.js#L24

:::

_hooksRefRegisterer.addHook(key, callback) ⇒ object_

Add hook to the collection.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |
| callback | `function` | The hook callback. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/hooksRefRegisterer.js#L49

:::

_hooksRefRegisterer.clearHooks()_

Clear all added hooks.



### removeHooksByKey
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/hooksRefRegisterer.js#L40

:::

_hooksRefRegisterer.removeHooksByKey(key)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |



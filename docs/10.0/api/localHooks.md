---
title: LocalHooks
metaTitle: LocalHooks - API Reference - Handsontable Documentation
permalink: /10.0/api/local-hooks
canonicalUrl: /api/local-hooks
hotPlugin: false
editLink: false
---

# LocalHooks

[[toc]]
## Members

### _localHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/localHooks.js#L15

:::

_localHooks.\_localHooks_

Internal hooks storage.


## Methods

### addLocalHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/localHooks.js#L24

:::

_localHooks.addLocalHook(key, callback) ⇒ object_

Add hook to the collection.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The hook name. |
| callback | `function` | The hook callback. |



### clearLocalHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/localHooks.js#L62

:::

_localHooks.clearLocalHooks() ⇒ object_

Clear all added hooks.



### runLocalHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/mixins/localHooks.js#L44

:::

_localHooks.runLocalHooks(key, [arg1], [arg2], [arg3], [arg4], [arg5], [arg6])_

Run hooks.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The name of the hook to run. |
| [arg1] | `*` | `optional` An additional parameter passed to the callback function. |
| [arg2] | `*` | `optional` An additional parameter passed to the callback function. |
| [arg3] | `*` | `optional` An additional parameter passed to the callback function. |
| [arg4] | `*` | `optional` An additional parameter passed to the callback function. |
| [arg5] | `*` | `optional` An additional parameter passed to the callback function. |
| [arg6] | `*` | `optional` An additional parameter passed to the callback function. |



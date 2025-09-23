---
title: EventManager
metaTitle: EventManager - JavaScript Data Grid | Handsontable
permalink: /api/event-manager
canonicalUrl: /api/event-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 3k9p5r7t
description: Options, members, and methods of Handsontable's EventManager API.
react:
  id: 5j7d9k2r
  metaTitle: EventManager - React Data Grid | Handsontable
angular:
  id: c5v4e2wx
  metaTitle: EventManager - Angular Data Grid | Handsontable
---

# Plugin: EventManager

[[toc]]

## Description

Event DOM manager for internal use in Handsontable.



## Members

### context
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L19

:::

_eventManager.context : object_


## Methods

### addEventListener
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L43

:::

_eventManager.addEventListener(element, eventName, callback, [options]) ⇒ function_

Register specified listener (`eventName`) to the element.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| element | `Element` |  | Target element. |
| eventName | `string` |  | Event name. |
| callback | `function` |  | Function which will be called after event occur. |
| [options] | `AddEventListenerOptions` <br/> `boolean` | <code>false</code> | `optional` Listener options if object or useCapture if boolean. |


**Returns**: `function` - Returns function which you can easily call to remove that event.  

### clear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L131

:::

_eventManager.clear()_

Clear all previously registered events.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L138

:::

_eventManager.destroy()_

Destroy instance of EventManager, clearing all events of the context.



### destroyWithOwnEventsOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L146

:::

_eventManager.destroyWithOwnEventsOnly()_

Destroy instance of EventManager, clearing only the own events.



### fireEvent
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L157

:::

_eventManager.fireEvent(element, eventName)_

Trigger event at the specified target element.


| Param | Type | Description |
| --- | --- | --- |
| element | `Element` | Target element. |
| eventName | `string` | Event name. |



### removeEventListener
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/eventManager.js#L77

:::

_eventManager.removeEventListener(element, eventName, callback, [onlyOwnEvents])_

Remove the event listener previously registered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| element | `Element` |  | Target element. |
| eventName | `string` |  | Event name. |
| callback | `function` |  | Function to remove from the event target. It must be the same as during registration listener. |
| [onlyOwnEvents] | `boolean` | <code>false</code> | `optional` Whether whould remove only events registered using this instance of EventManager. |



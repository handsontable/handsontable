---
title: EventManager
metaTitle: EventManager - API Reference - Handsontable Documentation
permalink: /10.0/api/event-manager
canonicalUrl: /api/event-manager
hotPlugin: false
editLink: false
---

# EventManager

[[toc]]

## Description

Event DOM manager for internal use in Handsontable.



## Description


## Methods

### addEventListener
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/eventManager.js#L39

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/eventManager.js#L125

:::

_eventManager.clear()_

Clear all previously registered events.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/eventManager.js#L132

:::

_eventManager.destroy()_

Destroy instance of EventManager, clearing all events of the context.



### destroyWithOwnEventsOnly
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/eventManager.js#L140

:::

_eventManager.destroyWithOwnEventsOnly()_

Destroy instance of EventManager, clearing only the own events.



### fireEvent
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/eventManager.js#L151

:::

_eventManager.fireEvent(element, eventName)_

Trigger event at the specified target element.


| Param | Type | Description |
| --- | --- | --- |
| element | `Element` | Target element. |
| eventName | `string` | Event name. |



### removeEventListener
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/eventManager.js#L76

:::

_eventManager.removeEventListener(element, eventName, callback, [onlyOwnEvents])_

Remove the event listener previously registered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| element | `Element` |  | Target element. |
| eventName | `string` |  | Event name. |
| callback | `function` |  | Function to remove from the event target. It must be the same as during registration listener. |
| [onlyOwnEvents] | `boolean` | <code>false</code> | `optional` Whether whould remove only events registered using this instance of EventManager. |



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

[[toc]]

## Description

Event DOM manager for internal use in Handsontable.



## Description


## Methods

### addEventListener

::: ask-about-api addEventListener|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L38

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

::: ask-about-api clear|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L118

:::

_eventManager.clear()_

Clear all previously registered events.



### destroy

::: ask-about-api destroy|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L123

:::

_eventManager.destroy()_

Destroy instance of EventManager, clearing all events of the context.



### destroyWithOwnEventsOnly

::: ask-about-api destroyWithOwnEventsOnly|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L129

:::

_eventManager.destroyWithOwnEventsOnly()_

Destroy instance of EventManager, clearing only the own events.



### fireEvent

::: ask-about-api fireEvent|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L138

:::

_eventManager.fireEvent(element, eventName)_

Trigger event at the specified target element.


| Param | Type | Description |
| --- | --- | --- |
| element | `Element` | Target element. |
| eventName | `string` | Event name. |



### removeEventListener

::: ask-about-api removeEventListener|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L70

:::

_eventManager.removeEventListener(element, eventName, callback, [onlyOwnEvents])_

Remove the event listener previously registered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| element | `Element` |  | Target element. |
| eventName | `string` |  | Event name. |
| callback | `function` |  | Function to remove from the event target. It must be the same as during registration listener. |
| [onlyOwnEvents] | `boolean` | <code>false</code> | `optional` Whether whould remove only events registered using this instance of EventManager. |



## Description

Event DOM manager for internal use in Handsontable.



## Description


## Methods

### addEventListener

::: ask-about-api addEventListener|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L38

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

::: ask-about-api clear|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L118

:::

_eventManager.clear()_

Clear all previously registered events.



### destroy

::: ask-about-api destroy|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L123

:::

_eventManager.destroy()_

Destroy instance of EventManager, clearing all events of the context.



### destroyWithOwnEventsOnly

::: ask-about-api destroyWithOwnEventsOnly|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L129

:::

_eventManager.destroyWithOwnEventsOnly()_

Destroy instance of EventManager, clearing only the own events.



### fireEvent

::: ask-about-api fireEvent|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L138

:::

_eventManager.fireEvent(element, eventName)_

Trigger event at the specified target element.


| Param | Type | Description |
| --- | --- | --- |
| element | `Element` | Target element. |
| eventName | `string` | Event name. |



### removeEventListener

::: ask-about-api removeEventListener|EventManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/eventManager.ts#L70

:::

_eventManager.removeEventListener(element, eventName, callback, [onlyOwnEvents])_

Remove the event listener previously registered.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| element | `Element` |  | Target element. |
| eventName | `string` |  | Event name. |
| callback | `function` |  | Function to remove from the event target. It must be the same as during registration listener. |
| [onlyOwnEvents] | `boolean` | <code>false</code> | `optional` Whether whould remove only events registered using this instance of EventManager. |



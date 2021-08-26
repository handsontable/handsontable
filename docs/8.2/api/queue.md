---
title: Queue
metaTitle: Queue - API Reference - Handsontable Documentation
permalink: /8.2/api/queue
canonicalUrl: /api/queue
hotPlugin: false
editLink: false
---

# Queue

[[toc]]
## Members

### items
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/queue.js#L12

:::

_queue.items : Array_

Items collection.


## Methods

### dequeue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/queue.js#L29

:::

_queue.dequeue() ⇒ \*_

Remove the first element from the queue and returns it.



### enqueue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/queue.js#L20

:::

_queue.enqueue(...items)_

Add new item or items at the back of the queue.


| Param | Type | Description |
| --- | --- | --- |
| ...items | `*` | An item to add. |



### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/queue.js#L47

:::

_queue.isEmpty() ⇒ boolean_

Check if the queue is empty.



### peek
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/queue.js#L38

:::

_queue.peek() ⇒ \*_

Return the first element from the queue (without modification queue stack).



### size
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/queue.js#L56

:::

_queue.size() ⇒ number_

Return number of elements in the queue.



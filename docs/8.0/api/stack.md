---
title: Stack
metaTitle: Stack - API Reference - Handsontable Documentation
permalink: /8.0/api/stack
canonicalUrl: /api/stack
hotPlugin: false
editLink: false
---

# Stack

[[toc]]
## Members

### items
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/stack.js#L12

:::

_stack.items : Array_

Items collection.


## Methods

### isEmpty
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/stack.js#L47

:::

_stack.isEmpty() ⇒ boolean_

Check if the stack is empty.



### peek
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/stack.js#L38

:::

_stack.peek() ⇒ \*_

Return the last element from the stack (without modification stack).



### pop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/stack.js#L29

:::

_stack.pop() ⇒ \*_

Remove the last element from the stack and returns it.



### push
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/stack.js#L20

:::

_stack.push(...items)_

Add new item or items at the back of the stack.


| Param | Type | Description |
| --- | --- | --- |
| ...items | `*` | An item to add. |



### size
  
::: source-code-link https://github.com/handsontable/handsontable/blob/710a3bbf6ce1cb5d45e44290a64929caab01adc6/src/utils/dataStructures/stack.js#L56

:::

_stack.size() ⇒ number_

Return number of elements in the stack.



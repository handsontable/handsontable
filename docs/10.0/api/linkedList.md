---
title: LinkedList
metaTitle: LinkedList - API Reference - Handsontable Documentation
permalink: /10.0/api/linked-list
canonicalUrl: /api/linked-list
hotPlugin: false
editLink: false
---

# LinkedList

[[toc]]

## Description

Linked list.


## Methods

### hasCycle
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L156

:::

_linkedList.hasCycle() ⇒ boolean_

Check if linked list contains cycle.


**Returns**: `boolean` - Returns true if linked list contains cycle.  

### inorder
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L97

:::

_linkedList.inorder(callback)_

In order traversal of the linked list.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | Callback which should be executed on each node. |



### pop
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L185

:::

_linkedList.pop() ⇒ [NodeStructure](@/api/nodeStructure.md)_

Return last node from the linked list.


**Returns**: [`NodeStructure`](@/api/nodeStructure.md) - Last node.  

### push
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L55

:::

_linkedList.push(data)_

Add data to the end of linked list.


| Param | Type | Description |
| --- | --- | --- |
| data | `object` | Data which should be added. |



### recursiveReverse
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L217

:::

_linkedList.recursiveReverse()_

Reverses the linked list recursively.



### remove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L112

:::

_linkedList.remove(data) ⇒ boolean_

Remove data from the linked list.


| Param | Type | Description |
| --- | --- | --- |
| data | `object` | Data which should be removed. |


**Returns**: `boolean` - Returns true if data has been removed.  

### reverse
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L246

:::

_linkedList.reverse()_

Reverses the linked list iteratively.



### shift
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L202

:::

_linkedList.shift() ⇒ [NodeStructure](@/api/nodeStructure.md)_

Return first node from the linked list.


**Returns**: [`NodeStructure`](@/api/nodeStructure.md) - First node.  

### unshift
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/dataStructures/linkedList.js#L76

:::

_linkedList.unshift(data)_

Add data to the beginning of linked list.


| Param | Type | Description |
| --- | --- | --- |
| data | `object` | Data which should be added. |



---
title: Cursor
metaTitle: Cursor - Plugin - Handsontable Documentation
permalink: /10.0/api/cursor
canonicalUrl: /api/cursor
hotPlugin: true
editLink: false
---

# Cursor

[[toc]]

## Description

Helper class for checking if element will fit at the desired side of cursor.


## Methods

### fitsAbove
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/cursor.js#L74

:::

_cursor.fitsAbove(element) ⇒ boolean_

Checks if element can be placed above the cursor.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | Element to check if it's size will fit above the cursor. |



### fitsBelow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/cursor.js#L85

:::

_cursor.fitsBelow(element, [viewportHeight]) ⇒ boolean_

Checks if element can be placed below the cursor.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | Element to check if it's size will fit below the cursor. |
| [viewportHeight] | `number` | `optional` The viewport height. |



### fitsOnLeft
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/cursor.js#L106

:::

_cursor.fitsOnLeft(element) ⇒ boolean_

Checks if element can be placed on the left on the cursor.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | Element to check if it's size will fit on the left of the cursor. |



### fitsOnRight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/cursor.js#L96

:::

_cursor.fitsOnRight(element, [viewportWidth]) ⇒ boolean_

Checks if element can be placed on the right of the cursor.


| Param | Type | Description |
| --- | --- | --- |
| element | `HTMLElement` | Element to check if it's size will fit on the right of the cursor. |
| [viewportWidth] | `number` | `optional` The viewport width. |



### getSourceType
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/cursor.js#L58

:::

_cursor.getSourceType(object) ⇒ string_

Get source type name.


| Param | Type | Description |
| --- | --- | --- |
| object | `*` | Event or Object with coordinates. |


**Returns**: `string` - Returns one of this values: `'literal'`, `'event'`.  

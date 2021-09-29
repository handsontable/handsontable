---
title: Border
metaTitle: Border - API Reference - Handsontable Documentation
permalink: /10.0/api/border
canonicalUrl: /api/border
hotPlugin: false
editLink: false
---

# Border

[[toc]]

## Description


## Methods

### appear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L359

:::

_border.appear(corners)_

Show border around one or many cells.


| Param | Type | Description |
| --- | --- | --- |
| corners | `Array` | The corner coordinates. |



### createBorders
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L157

:::

_border.createBorders(settings)_

Create border elements.


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The border settings. |



### createMultipleSelectorHandles
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L229

:::

_border.createMultipleSelectorHandles()_

Create multiple selector handler for mobile devices.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L730

:::

_border.destroy()_

Cleans up all the DOM state related to a Border instance. Call this prior to deleting a Border instance.



### disappear
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L714

:::

_border.disappear()_

Hide border.



### isPartRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L290

:::

_border.isPartRange(row, col) ⇒ boolean_


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |



### registerListeners
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L67

:::

_border.registerListeners()_

Register all necessary events.



### updateMultipleSelectionHandlesPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/border.js#L310

:::

_border.updateMultipleSelectionHandlesPosition(row, col, top, left, width, height)_


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| top | `number` | The top position of the handler. |
| left | `number` | The left position of the handler. |
| width | `number` | The width of the handler. |
| height | `number` | The height of the handler. |



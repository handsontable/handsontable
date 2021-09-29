---
title: Walkontable
metaTitle: Walkontable - API Reference - Handsontable Documentation
permalink: /10.0/api/walkontable
canonicalUrl: /api/walkontable
hotPlugin: false
editLink: false
---

# Walkontable

[[toc]]

## Description


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L262

:::

_walkontable.destroy()_

Destroy instance.



### draw
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L76

:::

_walkontable.draw([fastDraw]) ⇒ [Walkontable](@/api/walkontable.md)_

Force rerender of Walkontable.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [fastDraw] | `boolean` | <code>false</code> | `optional` When `true`, try to refresh only the positions of borders without rerendering                                   the data. It will only work if Table.draw() does not force                                   rendering anyway. |



### exportSettingsAsClassNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L216

:::

_walkontable.exportSettingsAsClassNames()_

Export settings as class names added to the parent element of the table.



### getCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L99

:::

_walkontable.getCell(coords, [topmost]) ⇒ HTMLElement_

Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
if not set or set to false, returns TD from the master table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `CellCoords` |  | The cell coordinates. |
| [topmost] | `boolean` | <code>false</code> | `optional` If set to `true`, it returns the TD element from the topmost overlay. For example,                                  if the wanted cell is in the range of fixed rows, it will return a TD element                                  from the top overlay. |



### getOverlayName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L209

:::

_walkontable.getOverlayName() ⇒ string_

Get overlay name.



### getSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L244

:::

_walkontable.getSetting(key, [param1], [param2], [param3], [param4]) ⇒ \*_

Get/Set Walkontable instance setting.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The settings key to retrieve. |
| [param1] | `*` | `optional` Additional parameter passed to the options defined as function. |
| [param2] | `*` | `optional` Additional parameter passed to the options defined as function. |
| [param3] | `*` | `optional` Additional parameter passed to the options defined as function. |
| [param4] | `*` | `optional` Additional parameter passed to the options defined as function. |



### getViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L195

:::

_walkontable.getViewport() ⇒ Array_



### hasSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L255

:::

_walkontable.hasSetting(key) ⇒ boolean_

Checks if setting exists.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The settings key to check. |



### scrollViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L152

:::

_walkontable.scrollViewport(coords, [snapToTop], [snapToRight], [snapToBottom], [snapToLeft]) ⇒ boolean_

Scrolls the viewport to a cell (rerenders if needed).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates to scroll to. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L168

:::

_walkontable.scrollViewportHorizontally(column, [snapToRight], [snapToLeft]) ⇒ boolean_

Scrolls the viewport to a column (rerenders if needed).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L184

:::

_walkontable.scrollViewportVertically(row, [snapToTop], [snapToBottom]) ⇒ boolean_

Scrolls the viewport to a row (rerenders if needed).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |



### update
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L138

:::

_walkontable.update(settings, value) ⇒ [Walkontable](@/api/walkontable.md)_


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The singular settings to update or if passed as object to merge with. |
| value | `*` | The value to set if the first argument is passed as string. |



## Description


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L262

:::

_walkontable.destroy()_

Destroy instance.



### draw
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L76

:::

_walkontable.draw([fastDraw]) ⇒ [Walkontable](@/api/walkontable.md)_

Force rerender of Walkontable.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [fastDraw] | `boolean` | <code>false</code> | `optional` When `true`, try to refresh only the positions of borders without rerendering                                   the data. It will only work if Table.draw() does not force                                   rendering anyway. |



### exportSettingsAsClassNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L216

:::

_walkontable.exportSettingsAsClassNames()_

Export settings as class names added to the parent element of the table.



### getCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L99

:::

_walkontable.getCell(coords, [topmost]) ⇒ HTMLElement_

Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
if not set or set to false, returns TD from the master table.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| coords | `CellCoords` |  | The cell coordinates. |
| [topmost] | `boolean` | <code>false</code> | `optional` If set to `true`, it returns the TD element from the topmost overlay. For example,                                  if the wanted cell is in the range of fixed rows, it will return a TD element                                  from the top overlay. |



### getOverlayName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L209

:::

_walkontable.getOverlayName() ⇒ string_

Get overlay name.



### getSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L244

:::

_walkontable.getSetting(key, [param1], [param2], [param3], [param4]) ⇒ \*_

Get/Set Walkontable instance setting.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The settings key to retrieve. |
| [param1] | `*` | `optional` Additional parameter passed to the options defined as function. |
| [param2] | `*` | `optional` Additional parameter passed to the options defined as function. |
| [param3] | `*` | `optional` Additional parameter passed to the options defined as function. |
| [param4] | `*` | `optional` Additional parameter passed to the options defined as function. |



### getViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L195

:::

_walkontable.getViewport() ⇒ Array_



### hasSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L255

:::

_walkontable.hasSetting(key) ⇒ boolean_

Checks if setting exists.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | The settings key to check. |



### scrollViewport
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L152

:::

_walkontable.scrollViewport(coords, [snapToTop], [snapToRight], [snapToBottom], [snapToLeft]) ⇒ boolean_

Scrolls the viewport to a cell (rerenders if needed).


| Param | Type | Description |
| --- | --- | --- |
| coords | `CellCoords` | The cell coordinates to scroll to. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportHorizontally
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L168

:::

_walkontable.scrollViewportHorizontally(column, [snapToRight], [snapToLeft]) ⇒ boolean_

Scrolls the viewport to a column (rerenders if needed).


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | Visual column index. |
| [snapToRight] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the right of the table. |
| [snapToLeft] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the left of the table. |



### scrollViewportVertically
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L184

:::

_walkontable.scrollViewportVertically(row, [snapToTop], [snapToBottom]) ⇒ boolean_

Scrolls the viewport to a row (rerenders if needed).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| [snapToTop] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the top of the table. |
| [snapToBottom] | `boolean` | `optional` If `true`, viewport is scrolled to show the cell on the bottom of the table. |



### update
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/core.js#L138

:::

_walkontable.update(settings, value) ⇒ [Walkontable](@/api/walkontable.md)_


| Param | Type | Description |
| --- | --- | --- |
| settings | `object` | The singular settings to update or if passed as object to merge with. |
| value | `*` | The value to set if the first argument is passed as string. |



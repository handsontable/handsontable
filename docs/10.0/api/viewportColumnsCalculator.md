---
title: ViewportColumnsCalculator
metaTitle: ViewportColumnsCalculator - API Reference - Handsontable Documentation
permalink: /10.0/api/viewport-columns-calculator
canonicalUrl: /api/viewport-columns-calculator
hotPlugin: false
editLink: false
---

# ViewportColumnsCalculator

[[toc]]

## Description

Calculates indexes of columns to render OR columns that are visible.
To redo the calculation, you need to create a new calculator.



## Members

### count
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L57

:::

_viewportColumnsCalculator.count : number_

Number of rendered/visible columns.



### DEFAULT_WIDTH
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L17

:::

_ViewportColumnsCalculator.DEFAULT\_WIDTH : number_

Default column width.



### endColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L71

:::

_viewportColumnsCalculator.endColumn : null_

Index of the last rendered/visible column (can be overwritten using overrideFn).



### startColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L64

:::

_viewportColumnsCalculator.startColumn : number | null_

Index of the first rendered/visible column (can be overwritten using overrideFn).



### startPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L78

:::

_viewportColumnsCalculator.startPosition : number | null_

Position of the first rendered/visible column (in px).


## Methods

### calculate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L93

:::

_viewportColumnsCalculator.calculate()_

Calculates viewport.



### getStretchedColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L217

:::

_viewportColumnsCalculator.getStretchedColumnWidth(column, baseWidth) ⇒ number | null_

Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual column index. |
| baseWidth | `number` | The default column width. |



### refreshStretching
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L173

:::

_viewportColumnsCalculator.refreshStretching(totalWidth)_

Recalculate columns stretching.


| Param | Type | Description |
| --- | --- | --- |
| totalWidth | `number` | The total width of the table. |



## Description

Calculates indexes of columns to render OR columns that are visible.
To redo the calculation, you need to create a new calculator.



## Members

### count
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L57

:::

_viewportColumnsCalculator.count : number_

Number of rendered/visible columns.



### DEFAULT_WIDTH
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L17

:::

_ViewportColumnsCalculator.DEFAULT\_WIDTH : number_

Default column width.



### endColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L71

:::

_viewportColumnsCalculator.endColumn : null_

Index of the last rendered/visible column (can be overwritten using overrideFn).



### startColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L64

:::

_viewportColumnsCalculator.startColumn : number | null_

Index of the first rendered/visible column (can be overwritten using overrideFn).



### startPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L78

:::

_viewportColumnsCalculator.startPosition : number | null_

Position of the first rendered/visible column (in px).


## Methods

### calculate
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L93

:::

_viewportColumnsCalculator.calculate()_

Calculates viewport.



### getStretchedColumnWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L217

:::

_viewportColumnsCalculator.getStretchedColumnWidth(column, baseWidth) ⇒ number | null_

Get stretched column width based on stretchH (all or last) setting passed in handsontable instance.


| Param | Type | Description |
| --- | --- | --- |
| column | `number` | The visual column index. |
| baseWidth | `number` | The default column width. |



### refreshStretching
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/calculator/viewportColumns.js#L173

:::

_viewportColumnsCalculator.refreshStretching(totalWidth)_

Recalculate columns stretching.


| Param | Type | Description |
| --- | --- | --- |
| totalWidth | `number` | The total width of the table. |



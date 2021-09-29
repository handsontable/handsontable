---
title: Viewport
metaTitle: Viewport - API Reference - Handsontable Documentation
permalink: /10.0/api/viewport
canonicalUrl: /api/viewport
hotPlugin: false
editLink: false
---

# Viewport

[[toc]]

## Description


## Methods

### areAllProposedVisibleColumnsAlreadyRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L485

:::

_viewport.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) ⇒ boolean_

Returns information whether proposedColumnsVisibleCalculator viewport
is contained inside column rendered in previous draw (cached in columnsRenderCalculator).


| Param | Type | Description |
| --- | --- | --- |
| proposedColumnsVisibleCalculator | `ViewportRowsCalculator` | The instance of the viewport calculator to compare with. |


**Returns**: `boolean` - Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
                   Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed).  

### areAllProposedVisibleRowsAlreadyRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L458

:::

_viewport.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) ⇒ boolean_

Returns information whether proposedRowsVisibleCalculator viewport
is contained inside rows rendered in previous draw (cached in rowsRenderCalculator).


| Param | Type | Description |
| --- | --- | --- |
| proposedRowsVisibleCalculator | `ViewportRowsCalculator` | The instance of the viewport calculator to compare with. |


**Returns**: `boolean` - Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
                   Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed).  

### createColumnsCalculator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L371

:::

_viewport.createColumnsCalculator(calculationType) ⇒ [ViewportRowsCalculator](@/api/viewportRowsCalculator.md)_

Creates:
- columnsRenderCalculator (before draw, to qualify columns for rendering)
- columnsVisibleCalculator (after draw, to measure which columns are actually visible).


| Param | Type | Description |
| --- | --- | --- |
| calculationType | `number` | The render type ID, which determines for what type of                                 calculation calculator is created. |



### createRenderCalculators
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L417

:::

_viewport.createRenderCalculators(fastDraw) ⇒ boolean_

Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
cols should be rendered).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fastDraw | `boolean` | <code>false</code> | If `true`, will try to avoid full redraw and only update the border positions.                           If `false` or `undefined`, will perform a full redraw. |


**Returns**: `boolean` - The fastDraw value, possibly modified.  

### createRowsCalculator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L308

:::

_viewport.createRowsCalculator(calculationType) ⇒ [ViewportRowsCalculator](@/api/viewportRowsCalculator.md)_

Creates:
- rowsRenderCalculator (before draw, to qualify rows for rendering)
- rowsVisibleCalculator (after draw, to measure which rows are actually visible).


| Param | Type | Description |
| --- | --- | --- |
| calculationType | `number` | The render type ID, which determines for what type of                                 calculation calculator is created. |



### createVisibleCalculators
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L445

:::

_viewport.createVisibleCalculators()_

Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are
the actually fully visible rows and columns).



### getColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L201

:::

_viewport.getColumnHeaderHeight() ⇒ number_



### getContainerFillWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L153

:::

_viewport.getContainerFillWidth() ⇒ number_



### getRowHeaderWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L235

:::

_viewport.getRowHeaderWidth() ⇒ number_



### getViewportHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L216

:::

_viewport.getViewportHeight() ⇒ number_



### getViewportWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L283

:::

_viewport.getViewportWidth() ⇒ number_



### getWorkspaceActualHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L183

:::

_viewport.getWorkspaceActualHeight() ⇒ number_



### getWorkspaceActualWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L190

:::

_viewport.getWorkspaceActualWidth() ⇒ number_



### getWorkspaceHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L47

:::

_viewport.getWorkspaceHeight() ⇒ number_



### getWorkspaceOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L176

:::

_viewport.getWorkspaceOffset() ⇒ number_



### hasHorizontalScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L128

:::

_viewport.hasHorizontalScroll() ⇒ boolean_

Checks if viewport has horizontal scroll.



### hasVerticalScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L119

:::

_viewport.hasVerticalScroll() ⇒ boolean_

Checks if viewport has vertical scroll.



### resetHasOversizedColumnHeadersMarked
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L507

:::

_viewport.resetHasOversizedColumnHeadersMarked()_

Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.



### sumColumnWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L137

:::

_viewport.sumColumnWidths(from, length) ⇒ number_


| Param | Type | Description |
| --- | --- | --- |
| from | `number` | The visual column index from the width sum is start calculated. |
| length | `number` | The length of the column to traverse. |



## Description


## Methods

### areAllProposedVisibleColumnsAlreadyRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L485

:::

_viewport.areAllProposedVisibleColumnsAlreadyRendered(proposedColumnsVisibleCalculator) ⇒ boolean_

Returns information whether proposedColumnsVisibleCalculator viewport
is contained inside column rendered in previous draw (cached in columnsRenderCalculator).


| Param | Type | Description |
| --- | --- | --- |
| proposedColumnsVisibleCalculator | `ViewportRowsCalculator` | The instance of the viewport calculator to compare with. |


**Returns**: `boolean` - Returns `true` if all proposed visible columns are already rendered (meaning: redraw is not needed).
                   Returns `false` if at least one proposed visible column is not already rendered (meaning: redraw is needed).  

### areAllProposedVisibleRowsAlreadyRendered
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L458

:::

_viewport.areAllProposedVisibleRowsAlreadyRendered(proposedRowsVisibleCalculator) ⇒ boolean_

Returns information whether proposedRowsVisibleCalculator viewport
is contained inside rows rendered in previous draw (cached in rowsRenderCalculator).


| Param | Type | Description |
| --- | --- | --- |
| proposedRowsVisibleCalculator | `ViewportRowsCalculator` | The instance of the viewport calculator to compare with. |


**Returns**: `boolean` - Returns `true` if all proposed visible rows are already rendered (meaning: redraw is not needed).
                   Returns `false` if at least one proposed visible row is not already rendered (meaning: redraw is needed).  

### createColumnsCalculator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L371

:::

_viewport.createColumnsCalculator(calculationType) ⇒ [ViewportRowsCalculator](@/api/viewportRowsCalculator.md)_

Creates:
- columnsRenderCalculator (before draw, to qualify columns for rendering)
- columnsVisibleCalculator (after draw, to measure which columns are actually visible).


| Param | Type | Description |
| --- | --- | --- |
| calculationType | `number` | The render type ID, which determines for what type of                                 calculation calculator is created. |



### createRenderCalculators
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L417

:::

_viewport.createRenderCalculators(fastDraw) ⇒ boolean_

Creates rowsRenderCalculator and columnsRenderCalculator (before draw, to determine what rows and
cols should be rendered).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fastDraw | `boolean` | <code>false</code> | If `true`, will try to avoid full redraw and only update the border positions.                           If `false` or `undefined`, will perform a full redraw. |


**Returns**: `boolean` - The fastDraw value, possibly modified.  

### createRowsCalculator
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L308

:::

_viewport.createRowsCalculator(calculationType) ⇒ [ViewportRowsCalculator](@/api/viewportRowsCalculator.md)_

Creates:
- rowsRenderCalculator (before draw, to qualify rows for rendering)
- rowsVisibleCalculator (after draw, to measure which rows are actually visible).


| Param | Type | Description |
| --- | --- | --- |
| calculationType | `number` | The render type ID, which determines for what type of                                 calculation calculator is created. |



### createVisibleCalculators
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L445

:::

_viewport.createVisibleCalculators()_

Creates rowsVisibleCalculator and columnsVisibleCalculator (after draw, to determine what are
the actually fully visible rows and columns).



### getColumnHeaderHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L201

:::

_viewport.getColumnHeaderHeight() ⇒ number_



### getContainerFillWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L153

:::

_viewport.getContainerFillWidth() ⇒ number_



### getRowHeaderWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L235

:::

_viewport.getRowHeaderWidth() ⇒ number_



### getViewportHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L216

:::

_viewport.getViewportHeight() ⇒ number_



### getViewportWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L283

:::

_viewport.getViewportWidth() ⇒ number_



### getWorkspaceActualHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L183

:::

_viewport.getWorkspaceActualHeight() ⇒ number_



### getWorkspaceActualWidth
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L190

:::

_viewport.getWorkspaceActualWidth() ⇒ number_



### getWorkspaceHeight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L47

:::

_viewport.getWorkspaceHeight() ⇒ number_



### getWorkspaceOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L176

:::

_viewport.getWorkspaceOffset() ⇒ number_



### hasHorizontalScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L128

:::

_viewport.hasHorizontalScroll() ⇒ boolean_

Checks if viewport has horizontal scroll.



### hasVerticalScroll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L119

:::

_viewport.hasVerticalScroll() ⇒ boolean_

Checks if viewport has vertical scroll.



### resetHasOversizedColumnHeadersMarked
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L507

:::

_viewport.resetHasOversizedColumnHeadersMarked()_

Resets values in keys of the hasOversizedColumnHeadersMarked object after updateSettings.



### sumColumnWidths
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/viewport.js#L137

:::

_viewport.sumColumnWidths(from, length) ⇒ number_


| Param | Type | Description |
| --- | --- | --- |
| from | `number` | The visual column index from the width sum is start calculated. |
| length | `number` | The length of the column to traverse. |



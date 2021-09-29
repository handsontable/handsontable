---
title: Renderer
metaTitle: Renderer - API Reference - Handsontable Documentation
permalink: /10.0/api/renderer
canonicalUrl: /api/renderer
hotPlugin: false
editLink: false
---

# Renderer

[[toc]]

## Description

Content renderer.


## Members

### renderer
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/renderer/index.js#L20

:::

_renderer.renderer : TableRenderer_

General renderer class used to render Walkontable content on screen.


## Methods

### adjust
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/renderer/index.js#L74

:::

_renderer.adjust()_

Adjusts the table (preparing for render).



### render
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/renderer/index.js#L81

:::

_renderer.render()_

Renders the table.



### setFilters
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/renderer/index.js#L39

:::

_renderer.setFilters(rowFilter, columnFilter) ⇒ [Renderer](@/api/renderer.md)_

Sets filter calculators for newly calculated row and column position. The filters are used to transform visual
indexes (0 to N) to source indexes provided by Handsontable.


| Param | Type | Description |
| --- | --- | --- |
| rowFilter | `RowFilter` | The row filter instance. |
| columnFilter | `ColumnFilter` | The column filter instance. |



### setHeaderContentRenderers
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/renderer/index.js#L65

:::

_renderer.setHeaderContentRenderers(rowHeaders, columnHeaders) ⇒ [Renderer](@/api/renderer.md)_

Sets row and column header functions.


| Param | Type | Description |
| --- | --- | --- |
| rowHeaders | `Array<function()>` | Row header functions. Factories for creating content for row headers. |
| columnHeaders | `Array<function()>` | Column header functions. Factories for creating content for column headers. |



### setViewportSize
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/3rdparty/walkontable/src/renderer/index.js#L52

:::

_renderer.setViewportSize(rowsCount, columnsCount) ⇒ [Renderer](@/api/renderer.md)_

Sets the viewport size of the rendered table.


| Param | Type | Description |
| --- | --- | --- |
| rowsCount | `number` | An amount of rows to render. |
| columnsCount | `number` | An amount of columns to render. |



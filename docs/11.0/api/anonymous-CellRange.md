---
title: Anonymous-CellRange
metaTitle: Anonymous-CellRange - API Reference - Handsontable Documentation
permalink: /11.0/api/anonymous-cell-range
canonicalUrl: /api/anonymous-cell-range
hotPlugin: false
editLink: false
---

# Anonymous-CellRange

[[toc]]
## Members

### from
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L14058

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[CellRange](@/api/cellRange.md).from : [CellCoords](@/api/cellCoords.md)_

Usually the same as highlight, but in Excel there is distinction - one can change
highlight within a selection.



### highlight
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L14050

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[CellRange](@/api/cellRange.md).highlight : [CellCoords](@/api/cellCoords.md)_

Used to draw bold border around a cell where selection was started and to edit the cell
when you press Enter. The highlight cannot point to headers (negative values) so its
coordinates object is normalized while assigning.



### to
  
::: source-code-link https://github.com/handsontable/handsontable/blob/02b383f1251b92a16acfecc11a5fa136efd15e1f/../src/3rdparty/walkontable/dist/walkontable.js#L14065

:::

_&lt;[anonymous](@/api/anonymous.md)&gt;~[CellRange](@/api/cellRange.md).to : [CellCoords](@/api/cellCoords.md)_

End selection.




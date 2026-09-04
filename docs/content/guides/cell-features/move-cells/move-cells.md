---
type: how-to
title: Move cells
metaTitle: Move cells - JavaScript Data Grid | Handsontable
description: Move or copy a selected range of cells by dragging its border. Formula references adjust automatically when the Formulas plugin is active.
permalink: /move-cells
canonicalUrl: /move-cells
tags:
  - move cells
  - drag to move
  - drag and drop
  - relocate cells
  - movecells
react:
  metaTitle: Move cells - React Data Grid | Handsontable
angular:
  metaTitle: Move cells - Angular Data Grid | Handsontable
vue:
  metaTitle: Move cells - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: new
---
Move or copy a selected range of cells by dragging its border, the same way you would in a spreadsheet application.

[[toc]]

## Overview

When you set [`moveCells`](@/api/options.md#movecells) to `true`, hovering the border of a selected cell range shows a grab cursor. Dragging that border moves the block's data -- cell values and formatting -- to the new location. Hold <kbd>**Ctrl**</kbd> (Windows) or <kbd>⌘</kbd> (Mac) during the drag to copy instead of move. Press <kbd>**Escape**</kbd> to cancel a drag before releasing.

The `moveCells` option was introduced in Handsontable 18.1.0. To move whole rows or columns instead of a cell range, see the [Row moving](@/guides/rows/row-moving/row-moving.md) and [Column moving](@/guides/columns/column-moving/column-moving.md) guides.

## Enable cell moving

To enable drag-to-move, set the [`moveCells`](@/api/options.md#movecells) option to `true`:

```javascript
moveCells: true,
```

This option applies at the grid level and defaults to `false`.

Select a range of cells in the demo below, then drag its border to a new location. Hold <kbd>**Ctrl**</kbd> or <kbd>⌘</kbd> to copy the range instead of moving it.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-features/move-cells/javascript/example1.html)
@[code](@/content/guides/cell-features/move-cells/javascript/example1.js)
@[code](@/content/guides/cell-features/move-cells/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/move-cells/react/example1.jsx)
@[code](@/content/guides/cell-features/move-cells/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/move-cells/angular/example1.ts)
@[code](@/content/guides/cell-features/move-cells/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/move-cells/vue/example1.vue)

:::

:::

## Moving cells with formulas

When the [`formulas`](@/api/options.md#formulas) plugin is active, formula references adjust automatically on move -- the same way they do in Excel.

## Limitations

- Drag-to-move works on a single contiguous cell range only. It has no effect on full-row, full-column, select-all, or multiple selections.
- The target must stay within the grid. Neither the target nor the source may overlap read-only cells, because a move has to clear the source. Copying with <kbd>**Ctrl**</kbd> or <kbd>⌘</kbd> leaves the source in place, so a read-only source cell blocks a move but not a copy.
- Drag-to-move is hidden when [`disableVisualSelection`](@/api/options.md#disablevisualselection) is set.
- A move that would split a merged cell is blocked.

## Hooks

- [`beforeMoveCells`](@/api/hooks.md#beforemovecells) fires before the data relocates. Return `false` from the handler to cancel the move.
- [`afterMoveCells`](@/api/hooks.md#aftermovecells) fires after the data has been relocated.

## Move cells programmatically

To move or copy a range from code, call the plugin's `moveCellRange()` method:

```javascript
hot.getPlugin('moveCells').moveCellRange(sourceRange, targetTopLeft, isCopy);
```

## Related articles

**Related guides**

<div class="boxes-list">

- [Selection](@/guides/cell-features/selection/selection.md)
- [Row moving](@/guides/rows/row-moving/row-moving.md)
- [Column moving](@/guides/columns/column-moving/column-moving.md)

</div>

**Configuration options**

<div class="boxes-list">

- [moveCells](@/api/options.md#movecells)
- [disableVisualSelection](@/api/options.md#disablevisualselection)

</div>

**Hooks**

<div class="boxes-list">

- [afterMoveCells](@/api/hooks.md#aftermovecells)
- [beforeMoveCells](@/api/hooks.md#beforemovecells)

</div>

**Plugins**

<div class="boxes-list">

- [MoveCells](@/api/moveCells.md)

</div>

Microsoft and Excel are registered trademarks of Microsoft Corporation.

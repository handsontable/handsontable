---
title: Repaint a single cell instead of the whole viewport
metaTitle: Repaint a single cell instead of the whole viewport - JavaScript Data Grid | Handsontable
description: Skip the render that follows a cell edit and run one cell's renderer by hand, so an expensive custom renderer runs once instead of dozens of times -- and learn when this is unsafe.
permalink: /recipes/performance/repaint-single-cell
canonicalUrl: /recipes/performance/repaint-single-cell
tags:
  - render
  - renderer
  - performance
  - beforeViewRender
  - skipRender
  - custom renderer
  - single cell
searchCategory: Recipes
category: Performance
type: how-to
menuTag: new
---

In this tutorial, you will cancel the render that Handsontable runs after a cell edit and repaint only the cell that changed. You will learn when this is worth doing, how to reproduce what Handsontable's own render does to a `td`, and the cases in which you must let the full render happen instead.

::: only-for javascript

::: example #example1 :hot-recipe --js 1

@[code](@/content/recipes/performance/repaint-single-cell/javascript/example1.js)
@[code](@/content/recipes/performance/repaint-single-cell/javascript/example1.html)

:::

:::

## Overview

**Difficulty:** Advanced
**Time:** ~30 minutes

Handsontable has no built-in per-cell render, and [`render()`](@/api/core.md#render) always redraws every cell in the rendered part of the grid. That is the right default: virtualization keeps the number of drawn cells low and roughly constant, so a render costs about the same whether you hold 100 rows or 100,000.

The default stops paying off when your renderers are expensive. Every redrawn cell runs its renderer and the [`cells`](@/api/options.md#cells) function again, so one edit re-runs work for the whole viewport. This recipe shows how to skip that render and repaint one cell instead.

Click the two buttons in the example above and compare the renderer-call counts. One edit runs the renderer for every cell on screen -- dozens of them -- while the repaint runs it once. Widen the grid or the viewport and the gap grows with it, because the number of drawn cells is what the full render pays for.

This recipe is written for the JavaScript build. Read [Framework wrappers](#framework-wrappers-need-more-care) before porting it.

## What You'll Build

A product-inventory grid with a deliberately expensive cell renderer, and a `repaintCell()` helper that:

- Cancels the render that follows [`setDataAtCell()`](@/api/core.md#setdataatcell), using the [`beforeViewRender`](@/api/hooks.md#beforeviewrender) hook.
- Runs one cell's renderer against its `td`, reproducing what Handsontable's own render does to that element.
- Falls back to a normal render whenever the change is not safe to handle per cell.
- Reports the renderer-call count for each update, so you can see the difference.

## Before you begin

This recipe uses only built-in Handsontable features. No extra dependencies are required.

Read [Understanding rendering](@/guides/optimization/rendering/rendering.md) first. This recipe steps outside the rendering model described there, and the [limitations](#limitations) below only make sense once you know what a normal render does.

You should be familiar with:

- Writing a [custom cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md).
- The [`beforeChange`](@/api/hooks.md#beforechange) hook and the `source` argument that identifies where a change came from.

## Step 1 -- Import the renderers you need

Import the renderer functions directly. The `handsontable/base` entry does not define the `Handsontable.renderers` namespace -- only the full `handsontable` entry does -- so reaching for `Handsontable.renderers.TextRenderer` on a modular build throws:

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import { baseRenderer } from 'handsontable/renderers/baseRenderer';

registerAllModules();
```

## Step 2 -- Understand what a render does to a `td`

Handsontable recycles `td` elements as you scroll, so before it runs a renderer it clears the element: the `class` attribute, the inline `style`, the `dir` attribute, and every accessibility attribute. A renderer always starts from a blank `td`.

Your repaint has to do the same, or state from the previous value survives into the new one:

```javascript
function resetCell(td) {
  if (!td.classList.contains('hide')) { // leave the hidden-columns marker alone
    td.className = '';
  }

  td.removeAttribute('style');
  td.removeAttribute('dir');

  Array.from(td.attributes).forEach(({ name }) => {
    if (name === 'role' || name.startsWith('aria-')) {
      td.removeAttribute(name);
    }
  });
}
```

## Step 3 -- Resolve the value the renderer receives

A renderer does not receive the raw value. Handsontable applies a formatter first: a cell-level `valueFormatter` wins, then the renderer's own `valueFormatter` static, which the `numeric` and `date` renderers set. Reproduce that precedence, or numbers and dates render unformatted:

```javascript
function formatCellValue(value, cellProperties, renderer) {
  if (typeof cellProperties.valueFormatter === 'function') {
    return cellProperties.valueFormatter(value, cellProperties);
  }

  if (typeof renderer === 'function' && typeof renderer.valueFormatter === 'function') {
    return renderer.valueFormatter.call(cellProperties, value, cellProperties);
  }

  return value;
}
```

## Step 4 -- Run the renderer, and then the base renderer

Resolve the renderer from the cell metadata you already hold. [`getCellRenderer()`](@/api/core.md#getcellrenderer) also accepts a row and a column, but that form looks the metadata up again, re-running the [`cells`](@/api/options.md#cells) function this recipe exists to avoid.

Handsontable runs the base renderer after your renderer, unless your renderer chained it itself. The base renderer applies the classes that carry cell state: `htDimmed` for read-only cells, `htInvalid` for cells that failed validation, and the alignment classes.

Handsontable tracks the chaining with `_isBaseRendererCalled` on the cell metadata. Two rules matter:

- If you skip the check, a cell that uses a built-in renderer loses those classes.
- If you forget to reset the flag, it stays on the shared metadata object, and the **next full render** skips the base renderer for that cell. Reset it in a `finally` block, so a renderer that throws cannot leave it set.

```javascript
const renderer = hot.getCellRenderer(cellProperties);

hot.runHooks('beforeRenderer', td, visualRow, visualColumn, prop, value, cellProperties);

try {
  renderer(...rendererArgs);

  if (!cellProperties._isBaseRendererCalled) {
    baseRenderer(...rendererArgs);
  }
} finally {
  cellProperties._isBaseRendererCalled = false;
}

hot.runHooks('afterRenderer', td, visualRow, visualColumn, prop, value, cellProperties);
```

`_isBaseRendererCalled` is internal. It is the one part of this recipe that is not public API, so re-test your repaint when you upgrade Handsontable.

## Step 5 -- Cancel the render, and repaint in the same hook

[`setDataAtCell()`](@/api/core.md#setdataatcell) always ends in a full render. To stop it, set `skipRender` on the object that [`beforeViewRender`](@/api/hooks.md#beforeviewrender) receives.

**Repaint inside that same hook, not in [`afterChange`](@/api/hooks.md#afterchange).** Handsontable's order is: clear the `td`, run the renderer, then apply the selection classes. The selection is still drawn on the cancelled path, at the end of the same draw. A repaint that runs after the draw therefore clears the `class` attribute of a cell whose selection classes have already been applied, and nothing puts them back -- so the cell you just edited loses its highlight. Repainting inside the hook keeps Handsontable's order.

The data is already written by the time the hook runs, so the renderer reads the new value.

```javascript
// 1. Remember the grid's shape before the change lands.
hot.addHook('beforeChange', () => {
  counts.rows = hot.countRows();
  counts.columns = hot.countCols();
});

// 2. Decide whether this change is safe to handle per cell.
hot.addHook('beforeChangeRender', (changes, changeSource) => {
  pendingChanges = isRepaintable(changes, changeSource) ? changes : null;
});

// 3. Cancel the cell drawing and repaint, before the selection is applied.
hot.addHook('beforeViewRender', (isForced, skipRenderObject) => {
  if (!pendingChanges) {
    return;
  }

  skipRenderObject.skipRender = true;

  pendingChanges.forEach(([row, prop]) => {
    repaintCell(hot, row, hot.propToCol(prop));
  });

  pendingChanges = null;
});
```

## Step 6 -- Gate the cases you cannot handle

This is the step that keeps the recipe safe. Cancel the render only when all of the following hold, and let Handsontable render normally in every other case:

```javascript
function isRepaintable(changes, changeSource) {
  if (changeSource !== source || !changes || changes.length === 0 || changes.length > maxCells) {
    return false;
  }

  // A new spare row or a grown column changes the grid's shape.
  if (hot.countRows() !== counts.rows || hot.countCols() !== counts.columns) {
    return false;
  }

  return changes.every(([row, prop]) => {
    const column = hot.propToCol(prop);

    if (typeof column !== 'number' || isInFrozenArea(row, column)) {
      return false;
    }

    // `getCell()` answers with `null` or `undefined` when the cell is not
    // rendered, so there is nothing to paint.
    return hot.getCell(row, column, true) != null;
  });
}
```

Two details are easy to get wrong. Compare with `!= null`, not `!== null`: [`getCell()`](@/api/core.md#getcell) can return `undefined` for a cell in an overlay that is not present, and a strict comparison lets that through -- the render is then cancelled and nothing is painted.

And decide from the change itself, through its `source`, rather than by setting a flag around the call. With a validator configured, Handsontable applies the change from an asynchronous callback, so a flag you set before [`setDataAtCell()`](@/api/core.md#setdataatcell) and clear on the next line is already cleared by the time the decision is made.

Falling back is cheap: you lose the optimization for that one edit and keep a correct grid.

## Limitations

Handsontable cannot check these for you, so they are your responsibility. Each one is a reason the grid ships no per-cell render.

### Row heights must not change

Handsontable measures row heights during a render. Skip the render and no re-measurement happens, so a value that makes a row taller breaks the layout: the browser grows the row in the main table, while the row headers and any frozen columns keep the old heights. The two drift apart by the full height difference, and every row below the edit is misaligned.

Use this recipe only with fixed [`rowHeights`](@/api/options.md#rowheights), no [`autoRowSize`](@/api/options.md#autorowsize), and content that cannot wrap onto more lines. The misalignment corrects itself on the next full render, so calling [`render()`](@/api/core.md#render) is the recovery if you hit it.

### Column widths do not adapt

[`AutoColumnSize`](@/api/autoColumnSize.md) measures during a render too. A value that would have widened its column does not widen it.

### Turn auto-sizing off, or the saving disappears

[`autoRowSize`](@/api/options.md#autorowsize) and [`autoColumnSize`](@/api/options.md#autocolumnsize) measure by running your renderer against sample cells in an off-screen table. That sampling happens when a value changes, and it does not go through the render you just cancelled -- so your expensive renderer still runs dozens of times, and the repaint saves nothing.

Both are off in the example. Set explicit [`rowHeights`](@/api/options.md#rowheights) and column widths instead. This is the same requirement as the row-height rule above, seen from the other side.

### Cells in frozen areas need a full render

Handsontable draws frozen areas as separate copies of the table, so a cell can exist in several of them at once. How many copies it has is not a property of the axis you froze -- it depends on where the main table's rendered range starts, which moves with both the number of frozen rows or columns and the current scroll position.

Measured on one grid, at the top-left scroll position:

| Setting | Where cell (0, 0) exists | Copies |
|---|---|---|
| `fixedRowsTop: 1`, `fixedColumnsStart: 1` | main table, top, inline start, corner | **Four** |
| `fixedRowsTop: 2`, `fixedColumnsStart: 2` | corner only | One |
| `fixedRowsTop: 1`, `fixedColumnsStart: 2` | corner only | One |

[`getCell()`](@/api/core.md#getcell) reaches at most two of those: the main table's copy by default, and the topmost one when you pass `true` as the third argument. There is no supported way to reach the rest, so painting a frozen cell by hand can leave copies of it showing the old value.

The example therefore hands every cell in a frozen area to a normal render:

```javascript
function isInFrozenArea(row, column) {
  const { fixedRowsTop, fixedRowsBottom, fixedColumnsStart } = hot.getSettings();

  return row < fixedRowsTop ||
    row >= hot.countRows() - fixedRowsBottom ||
    column < fixedColumnsStart;
}
```

### Renderers that read other cells go stale

If a renderer reads another cell -- a total, a difference, a status derived from a neighbor -- repainting only the edited cell leaves that dependent cell showing the old result. Handsontable keeps no dependency graph between cells, so nothing can work out which other cells to repaint. Only you know. Repaint the dependent cells yourself, or let the full render run.

### Structural changes need a full render

Anything that changes the shape of the grid has to fall through: [`minSpareRows`](@/api/options.md#minsparerows) adding a row, a new column appearing in object data, a formula cascade, or an asynchronous validator writing more cells. The gate in Step 6 covers these by comparing the row and column counts.

### Framework wrappers need more care

The React wrapper registers its own [`beforeViewRender`](@/api/hooks.md#beforeviewrender) and [`afterViewRender`](@/api/hooks.md#afterviewrender) handlers: the first clears its cache of React cell portals, the second puts them back. Cancelling the render fires the first but not the second, because [`afterViewRender`](@/api/hooks.md#afterviewrender) only runs on a render that drew cells.

On a grid whose renderers are React components, that leaves the portal cache cleared and never restored. The same caution applies to any wrapper that keeps state in step with the render cycle.

Use this recipe on the JavaScript build. If you need it under a wrapper, verify it against your own cell renderers first.

## How It Works - Complete Flow

1. You call [`setDataAtCell()`](@/api/core.md#setdataatcell) with the recipe's own `source`.
2. `beforeChange` records the current row and column counts.
3. Handsontable writes the value and calls `beforeChangeRender`, where the gate decides whether this change qualifies.
4. Handsontable starts its render and fires `beforeViewRender`. If the change qualified, `skipRender` cancels the cell drawing and the repaint runs: clear the `td`, resolve the value, run the renderer, run the base renderer, restore the accessibility attributes.
5. The draw finishes. Overlay positions and the selection are applied on top of the freshly painted cell, in Handsontable's usual order.
6. Anything the gate turned down skips steps 4 and 5 and renders normally.

## What you learned

- A render covers the rendered part of the grid, so its cost scales with your renderers, not with your data.
- [`beforeViewRender`](@/api/hooks.md#beforeviewrender) can cancel the cell drawing while leaving overlays and selection intact -- and it is the right place to repaint, because the selection is applied after it.
- Repainting a cell means reproducing the `td` reset, the value formatting, and the base-renderer chaining.
- A frozen cell can exist in up to four tables, and [`getCell()`](@/api/core.md#getcell) reaches only two of them. The count follows the main table's rendered range, not the axis you froze.
- Row height, column width, and cross-cell dependencies are resolved during a render, so a per-cell repaint cannot maintain them.
- Cancelling a render also cancels [`afterViewRender`](@/api/hooks.md#afterviewrender), so anything listening for it -- including the framework wrappers -- stops being told.

## Next steps

- Before reaching for this recipe, reduce the *number* of renders with [`batch()`](@/api/core.md#batch). That is the supported lever, and it usually solves the problem on its own.
- Read [Understanding rendering](@/guides/optimization/rendering/rendering.md) for the full rendering model.
- See [Performance](@/guides/optimization/performance/performance.md) for grid-wide tuning.
- Review your [custom renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md) first. Making a renderer cheaper helps every render, including the ones this recipe does not cancel.

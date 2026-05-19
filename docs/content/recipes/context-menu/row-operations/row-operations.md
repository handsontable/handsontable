---
id: a3f8c1d2
title: Programmatic row operations
metaTitle: Programmatic row operations - JavaScript Data Grid | Handsontable
description: Learn how to add, delete, and reorder rows in Handsontable using external toolbar buttons wired to the alter() API and the ManualRowMove plugin.
permalink: /recipes/context-menu/row-operations
canonicalUrl: /recipes/context-menu/row-operations
tags:
  - guides
  - tutorial
  - recipes
react:
  id: b4c7d2e5
  metaTitle: Programmatic row operations - React Data Grid | Handsontable
angular:
  id: c5d8e3f6
  metaTitle: Programmatic row operations - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Context Menu and Interaction
type: how-to
---

In this tutorial, you will add, delete, and reorder rows in Handsontable using external toolbar buttons. You will learn how to wire buttons to the `alter()` API and the `ManualRowMove` plugin to give users full programmatic control over row order.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/context-menu/row-operations/javascript/example1.js)
@[code](@/content/recipes/context-menu/row-operations/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/context-menu/row-operations/react/example1.jsx)
@[code](@/content/recipes/context-menu/row-operations/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/context-menu/row-operations/angular/example1.ts)
@[code](@/content/recipes/context-menu/row-operations/angular/example1.html)

:::

:::

## Overview

This recipe shows how to wire four external toolbar buttons -- **Add Row**, **Delete Row**, **Move Up**, and **Move Down** -- to Handsontable's `alter()` API and the `ManualRowMove` plugin. This pattern is common in form-like grids where users manage an ordered list of items.

**Difficulty:** Beginner
**Time:** ~15 minutes

## What You'll Build

A Handsontable grid with a toolbar that lets you:

- Append a blank row at the bottom
- Delete all rows covered by the current selection
- Move the selected row one position up or down
- Disable **Move Up** when the first row is selected, and **Move Down** when the last row is selected

## Before you begin

You need a Handsontable instance. If you haven't set one up yet, follow the [Getting started](@/guides/getting-started/introduction/introduction.md) guide first.

Make sure you have a container element with four buttons in your HTML:

```html
<div class="row-toolbar">
  <button id="btn-add-row">Add Row</button>
  <button id="btn-delete-row">Delete Row</button>
  <button id="btn-move-up">Move Up</button>
  <button id="btn-move-down">Move Down</button>
</div>
<div id="example1"></div>
```

## Step 1: Enable ManualRowMove and initialize Handsontable

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const hot = new Handsontable(document.querySelector('#example1'), {
  data: myData,
  colHeaders: ['Task', 'Assignee', 'Priority', 'Status'],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  manualRowMove: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:**

- `manualRowMove: true` activates the `ManualRowMove` plugin. Without it, `hot.getPlugin('manualRowMove').moveRow()` does nothing.
- `registerAllModules()` registers all built-in plugins so they are available by name.

## Step 2: Track the selected row

The **Move Up** and **Move Down** buttons act on a single row. Use a module-level variable to track which row is currently selected, and keep it in sync via two hooks:

```javascript
let selectedRow = null;

hot.addHook('afterSelectionEnd', (row, col, row2) => {
  // Only track a single-row selection for move operations
  selectedRow = row === row2 ? Math.min(row, row2) : null;
  updateButtonStates();
});

hot.addHook('afterDeselect', () => {
  selectedRow = null;
  updateButtonStates();
});
```

**What's happening:**

- `afterSelectionEnd` fires after the user finishes selecting cells. The arguments `row` and `row2` are the start and end rows of the selection rectangle.
- When `row === row2`, a single row is selected -- store it in `selectedRow`. When multiple rows are selected, set `selectedRow` to `null` to disable the move buttons (you can only move one row at a time).
- `afterDeselect` fires when the grid loses focus or the selection is programmatically cleared. Reset `selectedRow` to `null`.

## Step 3: Sync button disabled states

Disable buttons that don't apply to the current selection:

```javascript
function updateButtonStates() {
  const hasSelection = selectedRow !== null;
  const isFirst = selectedRow === 0;
  const isLast = selectedRow === hot.countRows() - 1;

  btnDeleteRow.disabled = !hasSelection;
  btnMoveUp.disabled = !hasSelection || isFirst;
  btnMoveDown.disabled = !hasSelection || isLast;
}
```

**What's happening:**

- **Delete Row** is disabled when nothing is selected.
- **Move Up** is disabled on the first row -- there is nowhere to go.
- **Move Down** is disabled on the last row -- there is nowhere to go.
- Call `updateButtonStates()` after every hook callback and after every button action.

## Step 4: Add Row button

Append a blank row at the bottom:

```javascript
btnAddRow.addEventListener('click', () => {
  hot.alter('insert_row_below', hot.countRows() - 1);
});
```

**What's happening:**

- `hot.alter('insert_row_below', index)` inserts a row below `index`.
- Passing `hot.countRows() - 1` means "below the last row", which appends to the end.
- The new row is filled with `null` values -- the grid treats missing values as empty cells.

## Step 5: Delete Row button

Remove every row touched by the current selection:

```javascript
btnDeleteRow.addEventListener('click', () => {
  const selected = hot.getSelected();

  if (!selected) {
    return;
  }

  // Collect all row indices covered by the selection
  const rowSet = new Set();

  selected.forEach(([r1, , r2]) => {
    const from = Math.min(r1, r2);
    const to = Math.max(r1, r2);

    for (let r = from; r <= to; r++) {
      rowSet.add(r);
    }
  });

  // Delete from bottom to top to keep earlier indices valid
  const rows = [...rowSet].sort((a, b) => b - a);

  rows.forEach(row => hot.alter('remove_row', row, 1));
  selectedRow = null;
  updateButtonStates();
});
```

**What's happening:**

- `hot.getSelected()` returns an array of `[r1, c1, r2, c2]` tuples -- one per selection range (Handsontable supports non-contiguous multi-selection via `Ctrl+Click`).
- For each tuple, collect every row index between `r1` and `r2` into a `Set`. The `Set` deduplicates rows that appear in overlapping ranges.
- Sort the collected rows in descending order, then delete from bottom to top. If you delete row 2 first, the former row 3 becomes row 2, and all higher indices shift down -- your loop would then delete the wrong rows. Deleting from the bottom up avoids this shift problem entirely.
- Reset `selectedRow` and update button states after deleting.

## Step 6: Move Up button

Move the selected row one position earlier:

```javascript
btnMoveUp.addEventListener('click', () => {
  if (selectedRow === null || selectedRow === 0) {
    return;
  }

  hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow - 1);
  hot.render();
  selectedRow -= 1;
  hot.selectRows(selectedRow);
});
```

**What's happening:**

- `hot.getPlugin('manualRowMove').moveRow(from, to)` moves the row at visual index `from` to visual index `to`. After the move, the row occupies position `to`.
- `hot.render()` is required after `moveRow()` -- the plugin modifies internal index mappings but does not repaint the grid automatically.
- Update `selectedRow` to the new position and call `hot.selectRows()` to keep the row highlighted.

## Step 7: Move Down button

Move the selected row one position later:

```javascript
btnMoveDown.addEventListener('click', () => {
  if (selectedRow === null || selectedRow === hot.countRows() - 1) {
    return;
  }

  hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow + 2);
  hot.render();
  selectedRow += 1;
  hot.selectRows(selectedRow);
});
```

**What's happening:**

- Moving a row *down* requires a target index of `selectedRow + 2`, not `selectedRow + 1`. The `ManualRowMove` target is the slot *before which* the row is inserted. To place row 3 after row 4, you must insert it before slot 5 -- so the target is `3 + 2 = 5`.
- As with Move Up, call `hot.render()` and update `selectedRow`.

## How It Works - Complete Flow

1. **Initial state** - The grid renders with `manualRowMove: true`. All four buttons are disabled (no selection yet).
2. **User clicks a row** - `afterSelectionEnd` fires, `selectedRow` is updated, and `updateButtonStates()` enables **Delete Row** and the appropriate **Move Up** / **Move Down** buttons.
3. **Add Row clicked** - `hot.alter('insert_row_below', lastIndex)` appends a blank row. No selection change occurs.
4. **Delete Row clicked** - All selected rows are collected into a `Set`, sorted descending, and removed one by one. The selection is cleared and buttons are reset.
5. **Move Up or Move Down clicked** - `moveRow()` updates the internal row order, `hot.render()` repaints, and `hot.selectRows()` keeps the visual focus on the moved row.

## What you learned

- How to append rows with `hot.alter('insert_row_below', index)`
- How to delete multiple selected rows safely by sorting indices descending before removing
- How to reorder rows with `hot.getPlugin('manualRowMove').moveRow(from, to)` and why you must call `hot.render()` afterward
- Why moving a row down requires target `row + 2` (ManualRowMove inserts before the target slot)
- How to sync external button states with `afterSelectionEnd` and `afterDeselect` hooks

## Next steps

- To restrict row reordering at runtime, listen to the `beforeRowMove` hook and return `false` to cancel specific moves.
- To persist row order after a page reload, serialize the current row order with `hot.getPlugin('manualRowMove').getOrderedIndexes()` and restore it on init.
- To trigger the same operations from a context menu instead of toolbar buttons, see [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md).

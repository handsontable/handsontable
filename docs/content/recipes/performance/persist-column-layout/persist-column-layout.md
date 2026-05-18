---
id: f3a9b2d7
title: Persist and restore column widths and order
metaTitle: Persist and restore column widths and order - JavaScript Data Grid | Handsontable
description: Save column widths and column order to localStorage as the user resizes or reorders columns, then restore that layout on grid initialization -- so preferences survive a page refresh.
permalink: /recipes/performance/persist-column-layout
canonicalUrl: /recipes/performance/persist-column-layout
tags:
  - localStorage
  - column persistence
  - column order
  - manualColumnResize
  - manualColumnMove
  - afterColumnResize
  - afterColumnMove
  - performance
react:
  id: a8c2f1e9
  metaTitle: Persist and restore column widths and order - React Data Grid | Handsontable
angular:
  id: b5d3e7f0
  metaTitle: Persist and restore column widths and order - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Performance
type: how-to
---

In this tutorial, you will save column widths and column order to `localStorage` as the user resizes or reorders columns. You will learn how to restore that layout on grid initialization so user preferences survive a page refresh.

::: only-for javascript

::: example #example1 :hot-recipe --js 1

@[code](@/content/recipes/performance/persist-column-layout/javascript/example1.js)
@[code](@/content/recipes/performance/persist-column-layout/javascript/example1.html)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/performance/persist-column-layout/react/example1.jsx)
@[code](@/content/recipes/performance/persist-column-layout/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/performance/persist-column-layout/angular/example1.ts)
@[code](@/content/recipes/performance/persist-column-layout/angular/example1.html)

:::

:::

## Overview

**Difficulty:** Beginner
**Time:** ~20 minutes

This tutorial shows how to save column widths and column order to `localStorage` as the user resizes or reorders columns, then read those values back when the grid initializes. The result is a grid whose layout survives page refreshes.

## What You'll Build

A product-inventory grid with six columns (SKU, Name, Category, Price, Stock, Status) that:

- Saves column widths to `localStorage` after every resize (`afterColumnResize`).
- Saves column order to `localStorage` after every move (`afterColumnMove`).
- Restores the saved layout when the page loads.
- Falls back to default widths and order when no saved data exists, or when the stored data is malformed.
- Provides a **Reset layout** button that clears the saved state and restores defaults via `hot.updateSettings()`.

## Before you begin

This recipe uses only built-in Handsontable features. No extra dependencies are required.

You should be familiar with:

- Creating a basic Handsontable instance.
- The `manualColumnResize` and `manualColumnMove` options.

## Step 1 -- Define defaults and a storage key

```javascript
const STORAGE_KEY = 'ht-column-layout-v1';

const DEFAULT_COL_WIDTHS = [90, 200, 120, 90, 70, 110];
const DEFAULT_COL_ORDER = [0, 1, 2, 3, 4, 5];
```

**What's happening:** `STORAGE_KEY` is a namespaced key used for every `localStorage` read and write in this recipe. Namespacing prevents collisions with other data stored by the same page.

`DEFAULT_COL_WIDTHS` lists the pixel width for each column in its default order. `DEFAULT_COL_ORDER` is an array of physical column indices -- `[0, 1, 2, 3, 4, 5]` means the visual order matches the source order. Both are used when no saved layout exists and when the user clicks **Reset layout**.

**Why include a version suffix (`-v1`) in the key?** When you change the column count or column schema, old saved data becomes incompatible. Bumping the version suffix (`-v2`, `-v3`, ...) means the next page load finds nothing under the new key, falls back to defaults, and starts fresh. Old data under the previous key is left to expire naturally.

## Step 2 -- Read and validate the saved layout

```javascript
function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.widths) || !Array.isArray(parsed.order)) return null;

    return parsed;
  } catch {
    return null;
  }
}
```

**What's happening, step by step:**

1. `localStorage.getItem(STORAGE_KEY)` returns `null` when the key does not exist. The function returns `null` immediately in that case.
2. `JSON.parse()` can throw when the stored string is not valid JSON -- for example, when the browser truncated the write due to a storage quota error, or when an earlier version of the page stored plain text under the same key. The `try/catch` converts any parse error into a safe `null` return.
3. The `Array.isArray()` guards reject objects that look like JSON but are missing the expected `widths` and `order` keys -- for example, data written by a different schema version.

**Why not trust the stored data directly?** `localStorage` is writable by any script on the page, and its contents can be manually edited in browser DevTools. Defensive validation ensures a corrupt entry does not break the grid initialization.

## Step 3 -- Write the saved layout

```javascript
function saveLayout(widths, order) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widths, order }));
}
```

**What's happening:** `saveLayout` serializes both arrays into a single JSON object and writes it under the storage key. Grouping them in one object means a single `setItem` call -- `localStorage` operations are synchronous and blocking, so minimizing calls reduces the chance of a partial write.

## Step 4 -- Initialize Handsontable with the saved or default layout

```javascript
const saved = loadLayout();
const initialWidths = saved ? saved.widths : DEFAULT_COL_WIDTHS;
const initialOrder = saved ? saved.order : null;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['SKU', 'Name', 'Category', 'Price ($)', 'Stock', 'Status'],
  columns: [ /* ... */ ],
  colWidths: initialWidths,
  manualColumnResize: true,
  manualColumnMove: initialOrder || true,
  licenseKey: 'non-commercial-and-evaluation',
  /* hooks wired in the next step */
});
```

**What's happening:**

- `colWidths: initialWidths` sets the pixel widths for each column at startup. When `initialWidths` is the saved array, the columns start at exactly the sizes the user last saved.
- `manualColumnResize: true` activates the resize handle on every column header border, so the user can drag to resize.
- `manualColumnMove: initialOrder || true` deserves attention. When `manualColumnMove` receives an **array of physical indices**, Handsontable treats it as the initial visual-to-physical mapping and re-orders columns accordingly. When it receives `true`, columns start in their default order. Passing `null` or `false` would disable the feature entirely, so the fallback is `true`.

**Why pass the order to `manualColumnMove` instead of using `columnMapping`?** The `manualColumnMove` option is the documented way to specify an initial column order when the plugin is enabled. It reads the array once at initialization, sets up the column index mapper, and after that behaves exactly like `manualColumnMove: true`.

## Step 5 -- Capture and save column widths after a resize

```javascript
afterColumnResize() {
  const widths = hot.getColHeader().map((_, visualIndex) =>
    hot.getColWidth(visualIndex)
  );

  saveLayout(widths, getCurrentOrder());
},
```

**What's happening:**

- `afterColumnResize` fires after the user finishes dragging a column border. At that point the column's new width is already applied.
- `hot.getColHeader()` returns the current column headers array. Its length equals the number of columns, so mapping over it produces an index from `0` to `colCount - 1`.
- `hot.getColWidth(visualIndex)` returns the current pixel width for that visual column. Widths are read in **visual** order so the saved array aligns with the visual order at the time of saving.
- `getCurrentOrder()` (defined in Step 6) reads the current visual order. Both are saved together so the two arrays always stay in sync.

**Why save all widths, not just the resized one?** If only the changed column's width is stored, restoring requires knowing which column was last resized. Storing the full array keeps the saved state self-contained.

## Step 6 -- Capture and save column order after a move

```javascript
afterColumnMove(_movedColumns, _finalIndex, _dropIndex, _movePossible, movePerformed) {
  if (!movePerformed) return;
  saveLayout(getCurrentWidths(), getCurrentOrder());
},
```

**What's happening:**

- `afterColumnMove` fires after the user drops a column in a new position. The fifth parameter, `movePerformed`, is `false` when the drop did not actually change the order (for example, the user dropped a column back in the same position). Checking it avoids an unnecessary `localStorage` write.
- `getCurrentOrder()` and `getCurrentWidths()` read the current state at the moment the hook fires, so both values are always fresh.

**The helper functions:**

```javascript
function getCurrentOrder() {
  const count = hot.countCols();
  const order = [];

  for (let visualIndex = 0; visualIndex < count; visualIndex++) {
    order.push(hot.toPhysicalColumn(visualIndex));
  }

  return order;
}

function getCurrentWidths() {
  const count = hot.countCols();
  const widths = [];

  for (let visualIndex = 0; visualIndex < count; visualIndex++) {
    widths.push(hot.getColWidth(visualIndex));
  }

  return widths;
}
```

`hot.toPhysicalColumn(visualIndex)` translates a visual index to the underlying physical index. Physical indices correspond to column positions in the original `columns` array and do not change when columns are reordered. Saving physical indices means the stored order can always be interpreted as "visual slot N holds column at physical index M".

**Why iterate instead of calling a bulk API?** Handsontable does not expose a single method that returns the full visual-to-physical mapping array. The `toPhysicalColumn` loop is the idiomatic way to derive it.

## Step 7 -- Wire up the Reset layout button

```javascript
document.querySelector('#reset-layout-btn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);

  // Reset column order to the identity sequence [0, 1, 2, 3, 4, 5].
  hot.columnIndexMapper.setIndexesSequence(DEFAULT_COL_ORDER);

  // Reset each column width through the ManualColumnResize plugin API.
  const resizePlugin = hot.getPlugin('manualColumnResize');

  DEFAULT_COL_WIDTHS.forEach((width, visualIndex) => {
    resizePlugin.setManualSize(visualIndex, width);
  });

  hot.render();
});
```

**What's happening:**

1. `localStorage.removeItem(STORAGE_KEY)` deletes the saved entry so the next page load starts from defaults.
2. `hot.columnIndexMapper.setIndexesSequence(DEFAULT_COL_ORDER)` writes the identity sequence `[0, 1, 2, 3, 4, 5]` directly into the column index mapper, restoring the default visual order immediately without triggering additional moves.
3. `resizePlugin.setManualSize(visualIndex, width)` sets each column's stored width in the ManualColumnResize plugin's internal map. Because the sequence was reset first, visual and physical indices are in sync at this point.
4. `hot.render()` repaints the grid to reflect both changes at once.

**Why not `updateSettings({ colWidths, manualColumnMove })`?** `updateSettings` reapplies `manualColumnMove` by calling `moveColumns(array, 0)` on the current (already reordered) state -- which does not reliably restore the identity sequence. Similarly, `colWidths` is a core option, not the ManualColumnResize plugin's internal map, so passing it through `updateSettings` does not clear the widths the user has already set interactively. The direct plugin APIs bypass these limitations.

## How It Works - Complete Flow

1. **Page loads**: `loadLayout()` reads and validates `localStorage`. If data exists, `initialWidths` and `initialOrder` are set from it. Otherwise they fall back to `DEFAULT_COL_WIDTHS` and `null`.
2. **Grid initializes**: `colWidths` sets pixel widths. `manualColumnMove` sets the visual order when an array is provided, or enables the feature with the default order when `true`.
3. **User resizes a column**: `afterColumnResize` fires, reads all column widths and the current order, and writes both to `localStorage`.
4. **User moves a column**: `afterColumnMove` fires (if `movePerformed` is `true`), reads all widths and the new order, and writes both to `localStorage`.
5. **User refreshes the page**: Step 1 repeats. The saved layout is found, and the grid initializes with the user's preferred widths and order.
6. **User clicks Reset layout**: `localStorage` entry is removed. `hot.columnIndexMapper.setIndexesSequence()` restores default column order. `resizePlugin.setManualSize()` restores default widths per column. `hot.render()` repaints the grid. The next resize or move writes fresh data.

## What you learned

- Use `colWidths` to set initial column widths and `manualColumnMove` (with an array of physical indices) to set an initial visual order.
- Read all column widths with `hot.getColWidth(visualIndex)` and translate visual positions to physical indices with `hot.toPhysicalColumn(visualIndex)`.
- Use `afterColumnResize` and `afterColumnMove` to detect when the user changes the layout and persist those changes immediately.
- Validate data read from `localStorage` before using it, so malformed or stale entries fall back to defaults gracefully.
- Call `hot.columnIndexMapper.setIndexesSequence()` and `resizePlugin.setManualSize()` to reset column order and widths at runtime without recreating the grid.

## Next steps

- Extend the recipe to also persist `colHeaders` label overrides or hidden column state.
- If your page has multiple grids, give each grid its own storage key (e.g., `ht-column-layout-v1-products`, `ht-column-layout-v1-orders`).
- Replace `localStorage` with a server-side API call to sync layout preferences across devices and browsers.
- Combine this recipe with [Build a dynamic column visibility toggle](@/recipes/column-management/column-visibility/column-visibility.md) to let users both hide columns and remember their visibility state.

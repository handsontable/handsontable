---
id: c8f19a4e
title: Sync two grids
metaTitle: Sync two grids - JavaScript Data Grid | Handsontable
description: Learn how to sync edits from a master grid to a detail grid in real time with afterChange, setDataAtCell(), and source guards.
permalink: /recipes/data-management/sync-two-grids
canonicalUrl: /recipes/data-management/sync-two-grids
tags:
  - guides
  - tutorial
  - recipes
  - data synchronization
react:
  id: e3b7d2f9
  metaTitle: Sync two grids - React Data Grid | Handsontable
angular:
  id: a6d4c1b8
  metaTitle: Sync two grids - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

In this tutorial, you will sync edits from a master grid to a detail grid in real time. You will learn how to use `afterChange`, `setDataAtCell()`, and source guards to keep two Handsontable instances consistent without triggering infinite update loops.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/data-management/sync-two-grids/javascript/example1.js)
@[code](@/content/recipes/data-management/sync-two-grids/javascript/example1.ts)
@[code](@/content/recipes/data-management/sync-two-grids/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/data-management/sync-two-grids/react/example1.css)
@[code](@/content/recipes/data-management/sync-two-grids/react/example1.jsx)
@[code](@/content/recipes/data-management/sync-two-grids/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/data-management/sync-two-grids/angular/example1.ts)
@[code](@/content/recipes/data-management/sync-two-grids/angular/example1.html)
@[code](@/content/recipes/data-management/sync-two-grids/angular/example1.css)

:::

:::

## Overview

This recipe shows how to keep two Handsontable instances in sync on the same page. You edit data in the master grid, and the detail grid updates immediately.

The implementation uses `afterChange` and batched `setDataAtCell()` updates, plus a source guard to avoid infinite update loops.

**Difficulty:** Beginner
**Time:** ~10 minutes
**Libraries:** None (pure Handsontable)

## What you'll build

Two grids displayed side by side:

- **Master grid** - editable source data.
- **Detail grid** - synced preview with transformed values.

When you edit a row in the master grid, the related row in the detail grid is updated instantly.

## Step 1: Initialize two grid containers

Render two containers inside one recipe root element and place them side by side with CSS Grid.

```typescript
const appContainer = document.querySelector('#example1') as HTMLDivElement;

appContainer.innerHTML = `
  <div class="sync-grids-layout">
    <section class="sync-grids-card">
      <h4>Master grid (editable)</h4>
      <div id="master-grid"></div>
    </section>
    <section class="sync-grids-card">
      <h4>Detail grid (synced)</h4>
      <div id="detail-grid"></div>
    </section>
  </div>
`;
```

## Step 2: Create a detail model

Use a helper function to map master rows into preview rows. This lets you sync only selected columns and transform values before display.

```typescript
const toDetailRow = (row: MasterRow): DetailRow => ({
  customer: `${row.firstName} ${row.lastName}`,
  plan: row.plan.toUpperCase(),
  seats: row.seats,
  monthlyRevenue: `$${(row.seats * row.pricePerSeat).toFixed(2)}`,
});
```

## Step 3: Initialize detail grid

Create the detail table with `readOnly: true` so it acts as a live preview.

```typescript
const detailHot = new Handsontable(detailContainer, {
  data: masterData.map(toDetailRow),
  readOnly: true,
  // ...
});
```

## Step 4: Sync updates with `afterChange`

Use `afterChange` on the master instance. For each changed row, map the detail values and apply them in a single batched `setDataAtCell()` call.

```typescript
afterChange: (changes, source) => {
  if (!changes || source === 'sync-from-master' || source === 'loadData') {
    return;
  }

  changes.forEach(([row, prop, _oldValue, newValue]) => {
    // Update only mapped columns.
  });
}
```

The source check prevents re-entrant updates if synced writes trigger hooks, and batching keeps each row sync to one render pass.

## How it works - complete flow

1. You edit a value in the master grid.
2. `afterChange` receives row, column, and new value.
3. The handler updates only mapped fields in the detail row.
4. The detail grid receives updates via `setDataAtCell(..., 'sync-from-master')`.
5. The source guard ignores sync-originated updates, so no infinite loop occurs.

## Why this pattern is useful

- Keep one grid editable and another focused on read-only presentation.
- Sync only selected fields, not the whole dataset.
- Add value formatting or derived columns in one place.
- Avoid expensive full-table refreshes by patching changed cells only.

## What you learned

- How to use `afterChange` on one Handsontable instance to detect edits and propagate them to a second instance.
- How to use `setDataAtCell()` with a custom `source` string to apply updates without triggering an infinite re-entry loop.
- How a source guard (`if (source === 'sync-from-master') return`) prevents the synced writes from firing the `afterChange` hook again.
- How to batch multiple cell updates into a single `setDataAtCell()` call to keep each sync to one render pass.

## Next steps

- Extend the sync to work in both directions so either grid can serve as the master.
- Add a field mapping function to transform values (for example, format currency in the detail grid) before applying the sync.
- Explore the [undo/redo recipe](@/recipes/data-management/undo-redo-custom-ui/undo-redo-custom-ui.md) to let users revert synchronized changes.

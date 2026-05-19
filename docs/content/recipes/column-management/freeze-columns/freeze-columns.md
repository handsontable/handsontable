---
id: b4e7c9f2
title: Freeze and unfreeze columns at runtime
metaTitle: Freeze and unfreeze columns at runtime - JavaScript Data Grid | Handsontable
description: Freeze and unfreeze columns dynamically using external buttons that call hot.updateSettings with fixedColumnsStart, and understand how frozen columns interact with manual column reordering.
permalink: /recipes/column-management/freeze-columns
canonicalUrl: /recipes/column-management/freeze-columns
tags:
  - freeze columns
  - fixedColumnsStart
  - updateSettings
  - manualColumnMove
  - column management
react:
  id: c3d8e1f4
  metaTitle: Freeze and unfreeze columns at runtime - React Data Grid | Handsontable
angular:
  id: a7b2c5d9
  metaTitle: Freeze and unfreeze columns at runtime - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Column Management
type: how-to
---

In this tutorial, you will freeze and unfreeze columns at runtime using external buttons. You will learn how to call `hot.updateSettings` with `fixedColumnsStart` and how frozen columns interact with manual column reordering.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --html 2 --css 3

@[code](@/content/recipes/column-management/freeze-columns/javascript/example1.js)
@[code](@/content/recipes/column-management/freeze-columns/javascript/example1.html)
@[code](@/content/recipes/column-management/freeze-columns/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/column-management/freeze-columns/react/example1.css)
@[code](@/content/recipes/column-management/freeze-columns/react/example1.jsx)
@[code](@/content/recipes/column-management/freeze-columns/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --css 1 --ts 2 --html 3

@[code](@/content/recipes/column-management/freeze-columns/angular/example1.css)
@[code](@/content/recipes/column-management/freeze-columns/angular/example1.ts)
@[code](@/content/recipes/column-management/freeze-columns/angular/example1.html)

:::

:::

## Overview

**Difficulty:** Beginner
**Time:** ~15 minutes

This recipe shows how to freeze and unfreeze columns at runtime using `hot.updateSettings({ fixedColumnsStart: n })`. Frozen columns stay pinned to the left edge of the grid while the rest scroll horizontally. External buttons let users control the freeze boundary without touching the grid configuration directly.

## What You'll Build

- A row of **Freeze up to "Column"** buttons -- one per column -- generated from the column headers array
- An **Unfreeze all** button that resets the freeze boundary to zero
- A status indicator showing how many columns are currently frozen
- A guard that prevents freezing more columns than are present in the grid

## Before you begin

This recipe uses only the built-in Handsontable API. No extra dependencies are required.

The example uses marketing analytics data with eight columns: Campaign, Channel, Impressions, Clicks, Conversions, CPC, Revenue, and ROI. With many columns the grid scrolls horizontally, making frozen columns genuinely useful -- the identifier columns stay visible while metric columns scroll.

## Step 1 -- Set up the grid with fixedColumnsStart and manualColumnMove

```javascript
const hot = new Handsontable(container, {
  data,
  colHeaders,
  columns: [
    { data: 'campaign', type: 'text' },
    { data: 'channel', type: 'text' },
    { data: 'impressions', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'clicks', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'conversions', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'cpc', type: 'numeric', numericFormat: { pattern: '0.00' } },
    { data: 'revenue', type: 'numeric', numericFormat: { pattern: '$0,0' } },
    { data: 'roi', type: 'numeric', numericFormat: { pattern: '0.00' } },
  ],
  fixedColumnsStart: 0,
  manualColumnMove: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:** `fixedColumnsStart: 0` is the initial value -- no columns are frozen on load. `manualColumnMove: true` allows users to drag columns into different positions. Both options work together: after the user reorders columns, the freeze boundary still refers to the current visual order (the leftmost `n` columns in their current positions are frozen).

**Why set `fixedColumnsStart: 0` explicitly?** The default is `0`, but declaring it makes the initial state visible in the config and makes the runtime change more explicit to anyone reading the code.

## Step 2 -- Track state and apply the freeze boundary

```javascript
let frozenCount = 0;

function freezeUpTo(n) {
  const total = hot.countCols();

  frozenCount = Math.min(n, total);
  hot.updateSettings({ fixedColumnsStart: frozenCount });
  updateStatus();
}
```

**What's happening:** `frozenCount` is the single piece of mutable state in this recipe. `freezeUpTo(n)` clamps the requested freeze count to the actual number of columns (`hot.countCols()`) and then calls `hot.updateSettings()`. Clamping handles the edge case where a freeze button is clicked after columns have been hidden or removed.

**Why use `hot.updateSettings()` instead of modifying the config object directly?** `hot.updateSettings()` is the documented way to change grid settings at runtime. It triggers a full re-render and keeps Handsontable's internal state consistent. Modifying a config object directly has no effect on the rendered grid.

**Why `Math.min(n, total)`?** If `fixedColumnsStart` exceeds the number of rendered columns, Handsontable clamps it internally -- but being explicit in application code prevents confusion and makes the guard visible.

## Step 3 -- Generate freeze buttons from the column headers

```javascript
const colHeaders = ['Campaign', 'Channel', 'Impressions', 'Clicks', 'Conversions', 'CPC ($)', 'Revenue ($)', 'ROI'];

colHeaders.forEach((header, index) => {
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.textContent = `Freeze up to "${header}"`;
  btn.dataset.colIndex = String(index);

  btn.addEventListener('click', () => {
    freezeUpTo(index + 1);
  });

  controlsContainer.appendChild(btn);
});
```

**What's happening:** One button is generated for each column header. Clicking the button for column at index `i` calls `freezeUpTo(i + 1)`, which freezes columns `0` through `i` inclusive. Generating buttons from the same `colHeaders` array ensures the button labels and column positions are always in sync -- adding or renaming a column in the config automatically updates the button list.

**Why `index + 1`?** `fixedColumnsStart` is a count, not an index. To freeze the column at visual index `i`, you set the count to `i + 1`.

## Step 4 -- Add the Unfreeze all button

```javascript
document.querySelector('#unfreeze-btn').addEventListener('click', () => {
  frozenCount = 0;
  hot.updateSettings({ fixedColumnsStart: 0 });
  updateStatus();
});
```

**What's happening:** Setting `fixedColumnsStart: 0` releases all frozen columns. The grid re-renders without any pinned column overlay. The status indicator is updated to "No columns frozen".

## Step 5 -- Show a frozen column count indicator

```javascript
function updateStatus() {
  statusEl.textContent = frozenCount === 0
    ? 'No columns frozen'
    : `${frozenCount} column${frozenCount > 1 ? 's' : ''} frozen`;
}
```

**What's happening:** `updateStatus()` is called after every freeze or unfreeze action. It reads `frozenCount` -- not the grid setting -- because `frozenCount` is already clamped and reflects the actual frozen count. The status message uses a simple plural rule to display "1 column frozen" or "3 columns frozen".

## How It Works - Complete Flow

1. **Page load**: The grid initializes with `fixedColumnsStart: 0`. No columns are pinned. The status reads "No columns frozen". Freeze buttons are generated from `colHeaders`.
2. **User clicks "Freeze up to 'Channel'"**: `freezeUpTo(2)` is called. `frozenCount` becomes `2`. `hot.updateSettings({ fixedColumnsStart: 2 })` pins the first two columns (Campaign and Channel). The status reads "2 columns frozen".
3. **User drags a column**: Because `manualColumnMove: true` is set, the user can reorder columns by dragging. After reordering, the frozen count still applies to the current leftmost `n` columns -- whichever columns are now in positions 0 and 1. **This is the key caveat:** frozen columns are always the leftmost `n` columns in their current visual order, not a fixed set of named columns.
4. **User clicks "Unfreeze all"**: `frozenCount` resets to `0`. `hot.updateSettings({ fixedColumnsStart: 0 })` removes all frozen columns. The status reads "No columns frozen".

## What you learned

- Set `fixedColumnsStart: n` in the initial config or via `hot.updateSettings()` to pin the leftmost `n` columns.
- Call `hot.updateSettings({ fixedColumnsStart: 0 })` to unfreeze all columns.
- Generate freeze buttons programmatically from the `colHeaders` array so labels stay in sync with the grid configuration.
- `fixedColumnsStart` is a count from the left edge in current visual order -- not a named column reference. After column reordering, the frozen set changes accordingly.
- Clamp the freeze count with `Math.min(n, hot.countCols())` to handle edge cases where the requested count exceeds the number of visible columns.

## Next steps

- Combine this pattern with the [column visibility toggle](@/recipes/column-management/column-visibility/column-visibility.md) recipe to build a full column-management toolbar.
- Persist the `frozenCount` value to `localStorage` using the `afterUpdateSettings` hook so the freeze state survives a page refresh.
- Replace the individual freeze buttons with a single numeric input (`<input type="number">`) to let users type a freeze count directly.

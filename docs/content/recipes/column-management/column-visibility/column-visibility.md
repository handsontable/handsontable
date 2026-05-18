---
id: a3f8c2d1
title: Build a dynamic column visibility toggle
metaTitle: Dynamic Column Visibility Toggle - JavaScript Data Grid | Handsontable
description: Build a checkbox list outside the grid that shows or hides columns on demand, while preserving each column's type, renderer, and validator.
permalink: /recipes/column-management/column-visibility
canonicalUrl: /recipes/column-management/column-visibility
tags:
  - column visibility
  - updateSettings
  - toggle columns
  - column management
react:
  id: mab9c608
  metaTitle: Dynamic column visibility - React Data Grid | Handsontable
angular:
  id: c7d4e5f6
  metaTitle: Dynamic Column Visibility Toggle - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Column Management
type: how-to
---

In this tutorial, you will build a checkbox list outside the grid that shows or hides columns on demand. You will learn how to use `updateSettings` to update the `columns` array while preserving each column's type, renderer, and validator configuration.

::: only-for javascript

::: example #example1 :hot-recipe --html 1 --js 2

@[code](@/content/recipes/column-management/column-visibility/javascript/example1.html)
@[code](@/content/recipes/column-management/column-visibility/javascript/example1.js)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/column-management/column-visibility/react/example1.jsx)
@[code](@/content/recipes/column-management/column-visibility/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/column-management/column-visibility/angular/example1.ts)
@[code](@/content/recipes/column-management/column-visibility/angular/example1.html)

:::

:::

## Overview

**Difficulty:** Beginner
**Time:** ~15 minutes

This recipe shows how to build a checkbox list outside the grid that toggles column visibility. Each checkbox maps to a column. Checking or unchecking it calls `hot.updateSettings()` with a filtered subset of your full columns config. The column's type, renderer, and validator are always preserved because the source config is never mutated.

## What You'll Build

- A `<div id="column-toggles">` container above the grid, populated with one labeled checkbox per column
- An `allColumns` array that acts as the single source of truth for all column configurations
- Toggle logic that adds or removes a column index from a `visibleIndices` Set on each checkbox change
- A guard that prevents the user from hiding every column (at least one must remain visible)

## Before you begin

This recipe uses only the built-in Handsontable API. No extra dependencies are required.

The example uses HR/workforce data with seven columns: Name, Department, Role, Salary, Start Date, Location, and Status. The Salary column uses the `numeric` type with formatting. The Status column uses the `dropdown` type. This variety demonstrates that `hot.updateSettings()` restores each column's full configuration -- not just its header text.

## Step 1: Define the full columns config

```javascript
const allColumns = [
  { data: 'name', title: 'Name', type: 'text', width: 140 },
  { data: 'department', title: 'Department', type: 'text', width: 120 },
  { data: 'role', title: 'Role', type: 'text', width: 150 },
  {
    data: 'salary',
    title: 'Salary',
    type: 'numeric',
    numericFormat: { pattern: '$0,0', culture: 'en-US' },
    width: 110,
  },
  { data: 'startDate', title: 'Start Date', type: 'date', dateFormat: 'YYYY-MM-DD', width: 110 },
  { data: 'location', title: 'Location', type: 'text', width: 110 },
  {
    data: 'status',
    title: 'Status',
    type: 'dropdown',
    source: ['Active', 'On Leave', 'Inactive'],
    width: 100,
  },
];
```

**What's happening:** `allColumns` is declared once and never modified. Every toggle operation reads from it to produce a filtered subset. Keeping this array immutable means you can always reconstruct any combination of visible columns without storing redundant state.

**Why not mutate?** If you splice or delete entries from `allColumns`, you lose the config for hidden columns and cannot restore them. An immutable source lets you re-derive the visible set at any time.

## Step 2: Track visible column indices

```javascript
const visibleIndices = new Set(allColumns.map((_, i) => i));
```

**What's happening:** `visibleIndices` is a `Set` of integer indices into `allColumns`. It starts with every index (all columns visible). A `Set` is used rather than an array because membership checks (`has`) and removals (`delete`) are O(1), and duplicates are automatically prevented.

**Deriving the visible subset:**

```javascript
function getVisibleColumns() {
  return allColumns.filter((_, i) => visibleIndices.has(i));
}

function getVisibleHeaders() {
  return allColumns.filter((_, i) => visibleIndices.has(i)).map(col => col.title);
}
```

These two helpers produce the arguments that `hot.updateSettings()` needs on every toggle. They are pure functions with no side effects.

## Step 3: Initialize Handsontable

```javascript
const hot = new Handsontable(container, {
  data,
  columns: getVisibleColumns(),
  colHeaders: getVisibleHeaders(),
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:** The grid starts with all columns visible, so `getVisibleColumns()` and `getVisibleHeaders()` return full arrays at this point. The initial state of the grid and the initial checkbox state both derive from `visibleIndices`, so they are always in sync.

## Step 4: Generate the checkbox list

```javascript
const togglesContainer = document.querySelector('#column-toggles');

allColumns.forEach((col, index) => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');

  checkbox.type = 'checkbox';
  checkbox.checked = true;
  checkbox.dataset.colIndex = String(index);

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(col.title));
  togglesContainer.appendChild(label);
});
```

**What's happening:** The checkboxes are generated programmatically from `allColumns`, so the list never goes out of sync with the columns config. Each checkbox stores its column index in `dataset.colIndex`. Setting `checkbox.checked = true` on creation matches the initial state of `visibleIndices`.

**Why generate checkboxes in JS rather than hardcode them in HTML?** Generating them from the same `allColumns` array means a single source of truth. If you add or rename a column config entry, the checkbox list updates automatically.

## Step 5: Implement the toggle handler

```javascript
checkbox.addEventListener('change', () => {
  if (!checkbox.checked) {
    if (visibleIndices.size === 1) {
      checkbox.checked = true;  // revert -- cannot hide last column
      return;
    }
    visibleIndices.delete(index);
  } else {
    visibleIndices.add(index);
  }

  hot.updateSettings({
    columns: getVisibleColumns(),
    colHeaders: getVisibleHeaders(),
  });

  togglesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const idx = Number(cb.dataset.colIndex);

    cb.disabled = visibleIndices.size === 1 && visibleIndices.has(idx);
  });
});
```

**What's happening, step by step:**

1. When the user unchecks a box, the handler checks if only one column is currently visible. If so, it reverts the checkbox to checked and returns -- the grid is not changed.
2. Otherwise it removes the index from `visibleIndices` (hide) or adds it (show).
3. It calls `hot.updateSettings()` with the new `columns` and `colHeaders` arrays. Handsontable re-renders immediately.
4. It scans all checkboxes and disables the one checkbox whose column is the sole remaining visible column. A disabled checkbox shows the user that this column cannot be hidden right now.

**Why `hot.updateSettings()` instead of DOM manipulation?** Handsontable owns the grid's DOM. Modifying column elements directly would bypass Handsontable's internal state and cause rendering inconsistencies. `updateSettings()` is the documented way to change column configuration at runtime. It triggers a full re-render and keeps all internal state consistent.

**Why does the column type survive toggling?** When you re-show a column, `getVisibleColumns()` reads the original config object from `allColumns`. That object still has its `type`, `numericFormat`, `source`, or any other property you set. Nothing was lost because nothing was mutated.

## How It Works - Complete Flow

1. **Page load**: `allColumns` is declared. `visibleIndices` contains all indices. The grid initializes with all columns. Checkboxes are generated with `checked = true`.
2. **User unchecks "Salary"**: The change handler removes index 3 from `visibleIndices`. `hot.updateSettings()` is called with a four-column `columns` array and a four-item `colHeaders` array. The grid re-renders without the Salary column.
3. **User checks "Salary" again**: Index 3 is added back to `visibleIndices`. `hot.updateSettings()` restores the full numeric column config -- including `numericFormat` -- and the grid re-renders with Salary visible.
4. **User hides columns until only one remains**: The handler disables the last remaining checkbox. The user cannot produce an empty grid.

## What you learned

- Declare an immutable `allColumns` array as the single source of truth for all column configurations.
- Use a `Set` of indices to track visibility state and derive the active subset with a filter.
- Call `hot.updateSettings({ columns, colHeaders })` to apply column changes at runtime.
- Generate checkbox controls programmatically from the same config array to keep the UI in sync.
- Guard against an empty grid by checking `visibleIndices.size` before hiding a column.

## Next steps

- Add a **Show all** / **Hide all** button that sets `visibleIndices` to a full or minimal set and calls `hot.updateSettings()` once.
- Persist the visible set to `localStorage` so the user's column preferences survive page refreshes.
- Combine this pattern with `manualColumnResize` or `manualColumnMove` for a full column-management toolbar.
- Replace the checkbox list with a drag-and-drop column chooser panel for more advanced UI.

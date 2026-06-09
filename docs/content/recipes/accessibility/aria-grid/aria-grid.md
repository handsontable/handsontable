---
id: a7f3c2d1
title: ARIA-friendly grid
metaTitle: ARIA-Friendly Grid with Row Descriptions - JavaScript Data Grid | Handsontable
description: Configure Handsontable for screen reader compatibility using ariaTags, tabMoves, aria-label on cells, and aria-sort on headers -- targeting WCAG 2.1 AA compliance.
permalink: /recipes/accessibility/aria-grid
canonicalUrl: /recipes/accessibility/aria-grid
tags:
  - accessibility
  - aria
  - screen reader
  - wcag
  - recipes
react:
  id: 8fduuwvk
  metaTitle: ARIA-Friendly Grid with Row Descriptions - React Data Grid | Handsontable
angular:
  id: b3e9f1a2
  metaTitle: ARIA-Friendly Grid with Row Descriptions - Angular Data Grid | Handsontable
vue:
  id: huyklmef
  metaTitle: ARIA-Friendly Grid with Row Descriptions - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Accessibility & UX
type: how-to
---

In this tutorial, you will configure Handsontable for screen reader compatibility. You will learn how to use `ariaTags`, `tabMoves`, aria-label on cells, and aria-sort on headers to target WCAG 2.1 AA compliance.

::: only-for javascript

::: example #example1 :hot-recipe --js 1

@[code](@/content/recipes/accessibility/aria-grid/javascript/example1.js)

:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/accessibility/aria-grid/react/example1.jsx)
@[code](@/content/recipes/accessibility/aria-grid/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/accessibility/aria-grid/angular/example1.ts)
@[code](@/content/recipes/accessibility/aria-grid/angular/example1.html)

:::

:::

## Overview

This recipe shows how to configure Handsontable so screen readers can navigate the grid meaningfully. You will enable ARIA roles on grid elements, add descriptive `aria-label` attributes to every cell, expose sort state on column headers, and configure keyboard navigation to match screen reader conventions.

**Difficulty:** Beginner - Intermediate
**Time:** ~15 minutes

## What You'll Build

A grid that:
- Exposes `role="grid"`, `role="row"`, and `role="gridcell"` on the DOM elements screen readers expect
- Sets `aria-label` on each cell combining the column name and the cell value (e.g., `"Name: Ana García"`)
- Marks each column header with `aria-sort="none"` initially, updated to `ascending` or `descending` when sorted
- Moves focus one row down on both Tab and Enter so keyboard users advance predictably
- Disables wrap-around navigation to prevent disorienting jumps to the opposite end of the grid

## Before you begin

No additional dependencies are required. This recipe uses only the Handsontable core library.

If you have not set up a Handsontable project yet, follow the [Quick start](@/guides/getting-started/installation/installation.md) guide first.

## Step 1: Enable ARIA roles with `ariaTags`

```javascript
const hot = new Handsontable(container, {
  ariaTags: true,
  // ...
});
```

**What's happening:**
Setting `ariaTags: true` instructs Handsontable to stamp `role="grid"` on the outermost table container, `role="row"` on each row element, and `role="gridcell"` on each data cell. These roles are required by ARIA's grid pattern, allowing screen readers to announce the structure of the table correctly.

Without this option the DOM is still a visual table, but screen readers have no semantic cues to describe rows and cells as belonging to an interactive data grid.

## Step 2: Configure Tab and Enter navigation for screen readers

```javascript
const hot = new Handsontable(container, {
  tabMoves:   { row: 1, col: 0 },
  enterMoves: { row: 1, col: 0 },
  // ...
});
```

**What's happening:**
- `tabMoves: { row: 1, col: 0 }` makes Tab move to the next row in the same column instead of the next column. Screen reader users typically use Tab to move between interactive regions, and moving row-by-row matches that mental model better than moving cell-by-cell.
- `enterMoves: { row: 1, col: 0 }` makes Enter commit a cell edit and advance one row down. This mirrors spreadsheet conventions that screen reader users already know.

Both options accept a `{ row, col }` object. Negative values move backwards.

## Step 3: Disable wrap-around navigation

```javascript
const hot = new Handsontable(container, {
  autoWrapRow: false,
  autoWrapCol: false,
  // ...
});
```

**What's happening:**
By default, pressing Tab on the last column wraps focus to the first column of the next row, and pressing Tab on the last cell of the grid wraps back to the first cell. For sighted users this is convenient. For screen reader users it is disorienting -- the reader may announce a sudden column or row change that appears to have no cause.

Setting both `autoWrapRow` and `autoWrapCol` to `false` makes the grid stop at the boundaries, which matches what screen reader users expect from a navigation region.

## Step 4: Add `aria-label` to cells with a custom renderer

```javascript
const colHeaders = ['Name', 'Department', 'Role', 'Salary', 'Start Date'];

const hot = new Handsontable(container, {
  colHeaders,
  cells() {
    return {
      renderer(hotInstance, TD, row, col, prop, value, cellProperties) {
        getRenderer('text')(hotInstance, TD, row, col, prop, value, cellProperties);
        TD.setAttribute('aria-label', `${colHeaders[col]}: ${value || 'empty'}`);
      },
    };
  },
  // ...
});
```

**What's happening:**
The `cells()` callback returns a renderer for every cell. Inside the renderer:

1. `getRenderer('text')(...)` runs the built-in text renderer first. This ensures default rendering behavior (escaping, class names) is preserved.
2. `TD.setAttribute('aria-label', ...)` adds a human-readable label. The format `"Column: value"` gives screen readers a concise, self-contained description of each cell, for example `"Salary: 95000"` instead of just `"95000"`.

Passing `value || 'empty'` ensures that blank cells are announced as `"Name: empty"` rather than `"Name: "`, which some screen readers skip entirely.

**Why use `cells()` instead of `columns`?**
`cells()` applies the renderer to every column in one place. If you need column-specific formatting alongside the `aria-label`, move the renderer into each entry in the `columns` array instead.

## Step 5: Set `aria-sort` on column headers

```javascript
const hot = new Handsontable(container, {
  columnSorting: true,

  afterGetColHeader(col, TH) {
    if (!TH.hasAttribute('aria-sort')) {
      TH.setAttribute('aria-sort', 'none');
    }
  },
  // ...
});
```

**What's happening:**
The `afterGetColHeader` hook fires every time Handsontable renders a column header. The callback receives the visual column index (`col`) and the `<th>` DOM element (`TH`).

The `aria-sort` attribute on a column header tells screen readers whether the column is sorted and in which direction. WCAG 2.1 Success Criterion 1.3.1 requires that sort state is conveyed programmatically, not just visually.

The check `!TH.hasAttribute('aria-sort')` avoids overwriting `aria-sort` when the `columnSorting` plugin has already set it. When the user clicks a header to sort, Handsontable's `columnSorting` plugin updates `aria-sort` automatically to `"ascending"` or `"descending"`. The hook above only sets the initial `"none"` state that the plugin does not set on first render.

## How It Works - Complete Flow

1. **Initial render** -- `ariaTags: true` stamps `role="grid"`, `role="row"`, and `role="gridcell"` on the DOM. The `afterGetColHeader` hook sets `aria-sort="none"` on each header. The custom renderer sets `aria-label="Column: value"` on each cell.
2. **User presses Tab** -- Focus moves to the next row in the same column (not the next cell sideways). Screen readers announce the new row.
3. **User presses Enter** -- Any open editor commits the value and focus moves one row down.
4. **User clicks a column header** -- The `columnSorting` plugin sorts the data and updates `aria-sort` on the header to `"ascending"` or `"descending"`. The custom renderer re-runs and updates all `aria-label` attributes to reflect the new row order.
5. **User reaches the grid boundary** -- Tab and Enter stop. No unexpected wrap-around jump occurs.

## Testing with Chrome DevTools Accessibility panel

To verify the ARIA attributes are present:

1. Open the page in Chrome and right-click the grid.
2. Select **Inspect**.
3. In the Elements panel, click the **Accessibility** tab (top right area of DevTools).
4. Select any `<td>` inside the grid. The Accessibility panel shows the computed role (`gridcell`) and the `aria-label` value.
5. Select a `<th>` in the column header row and verify `aria-sort` is present.
6. Click a column header to sort, then re-select the `<th>`. The `aria-sort` attribute should update to `ascending` or `descending`.

You can also use the **Full Page Accessibility Tree** (the document icon in the Accessibility panel) to browse all roles and labels without needing to click individual elements.

## What you learned

- `ariaTags: true` adds the semantic roles (`grid`, `row`, `gridcell`) that screen readers rely on.
- A custom renderer calling `TD.setAttribute('aria-label', ...)` gives every cell a descriptive, self-contained label.
- `afterGetColHeader` initializes `aria-sort="none"` on each header; the `columnSorting` plugin updates it automatically when sorting.
- `tabMoves` and `enterMoves` set to `{ row: 1, col: 0 }` align keyboard navigation with screen reader conventions.
- `autoWrapRow: false` and `autoWrapCol: false` prevent disorienting focus jumps at grid boundaries.

## Next steps

- Explore the full ARIA Grid pattern in the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).
- Add `aria-live` regions outside the grid to announce data loading states when used with the `DataProvider` plugin.
- Test with a real screen reader -- [NVDA](https://www.nvaccess.org/) (Windows, free) and [VoiceOver](https://support.apple.com/guide/voiceover/welcome/mac) (macOS/iOS, built-in) are the most commonly used.
- Review [WCAG 2.1 Success Criterion 4.1.2](https://www.w3.org/TR/WCAG21/#name-role-value) for the full Name, Role, Value requirement that `aria-label` and `role` attributes address.

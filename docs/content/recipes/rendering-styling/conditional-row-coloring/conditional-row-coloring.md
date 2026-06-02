---
id: ceb1a2d8
title: Conditional row coloring
metaTitle: Conditional row coloring - JavaScript Data Grid | Handsontable
description: Color entire rows from a status column using the cells callback, className, and scoped CSS that updates after edits.
permalink: /recipes/rendering-styling/conditional-row-coloring
canonicalUrl: /recipes/rendering-styling/conditional-row-coloring
tags:
  - guides
  - tutorial
  - recipes
  - styling
react:
  id: f7c3e91a
  metaTitle: Conditional row coloring - React Data Grid | Handsontable
angular:
  id: b2d804e6
  metaTitle: Conditional row coloring - Angular Data Grid | Handsontable
vue:
  id: 99nmgb2v
  metaTitle: Conditional row coloring - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Rendering and styling
type: how-to
---

In this tutorial, you will color entire rows based on a status column value. You will learn how to use the `cells` callback and `className` to apply conditional CSS classes that update automatically after every edit.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/rendering-styling/conditional-row-coloring/javascript/example1.js)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/javascript/example1.ts)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/rendering-styling/conditional-row-coloring/react/example1.css)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/react/example1.jsx)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/rendering-styling/conditional-row-coloring/angular/example1.ts)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/angular/example1.html)
@[code](@/content/recipes/rendering-styling/conditional-row-coloring/angular/example1.css)

:::

:::

[[toc]]

## Overview

This recipe shows how to tint every cell in a row based on a **Status** value (`active`, `pending`, or `inactive`). You map each status to a CSS class, attach that class to cells through Handsontable metadata, and keep colors correct on first load and after the user edits **Status**.

**Difficulty:** Beginner  
**Time:** ~10 minutes  
**Libraries:** None beyond Handsontable.

## What You'll Build

A grid that:
- Tints active rows with a blue background
- Tints pending rows with an amber background
- Grays out inactive rows with muted text
- Updates row colors instantly when the user changes the Status dropdown

## Step 1: Define the status-to-class mapping

Create a lookup object that maps each status string to a CSS class name. Keeping it in one place means you only touch one object if you add or rename statuses.

```typescript
const STATUS_ROW_CLASSES: Record<string, string> = {
  active: 'ht-demo-row-status-active',
  pending: 'ht-demo-row-status-pending',
  inactive: 'ht-demo-row-status-inactive',
};

function statusToRowClass(status: unknown): string | undefined {
  if (typeof status !== 'string') {
    return undefined;
  }
  return STATUS_ROW_CLASSES[status];
}
```

**Why a lookup object?**
- All status-to-class rules live in one place.
- Adding a new status (`archived`, `draft`, ...) requires one new entry -- no scattered `if/else` chains.
- The helper function guards against non-string values (empty cells, `null`, numbers) and returns `undefined` so callers can skip the class safely.

**Why prefix class names with `ht-demo-`?**
- Avoids collisions with Handsontable's own internal CSS classes.
- Makes it obvious in DevTools which classes come from your code.

## Step 2: Wire up the `cells` callback

The [`cells`](@/api/options.md#cells) callback runs while Handsontable builds cell metadata before each render. Return a `{ className }` object and Handsontable applies that class directly to the `<td>` element.

```typescript
cells(
  this: CellProperties,
  row: number,
  _column: number,
  _prop: string | number,
): CellMeta {
  const hot = this.instance;
  const visualRow = hot.toVisualRow(row);

  if (visualRow === null || visualRow < 0) {
    return {};
  }

  const status = hot.getDataAtRowProp(visualRow, 'status');
  const rowClass = statusToRowClass(status);

  if (!rowClass) {
    return {};
  }

  return { className: rowClass };
},
```

**Key points:**

- `cells` receives the **physical** row index. You must call `hot.toVisualRow(row)` to get the **visual** index before reading data. Without this, sorting or row moves would read data from the wrong row.
- `hot.getDataAtRowProp(visualRow, 'status')` reads the Status value by property name, which works with object-based data (`[{ task, owner, status }]`).
- Returning `{}` (no class) for unrecognized statuses leaves the cell unstyled rather than applying a stale class.
- Use a regular `function` (not an arrow function) so `this` refers to the [`CellProperties`](@/api/cellProperties.md) object and `this.instance` gives you the grid.

**Why `cells` and not a custom renderer?**

The `cells` callback applies metadata to every column in the row automatically. A custom renderer would require you to add the same logic to each column's renderer, or wrap the default renderer yourself. Use `cells` for row-level styling; use a renderer only when you need to change what is inside the cell.

## Step 3: Configure columns and data

Set up the grid with a dropdown for the Status column so the user can change values:

```typescript
const hotOptions: Handsontable.GridSettings = {
  data,
  licenseKey: 'non-commercial-and-evaluation',
  rowHeaders: true,
  colHeaders: ['Task', 'Owner', 'Status'],
  height: 'auto',
  width: '100%',
  columns: [
    { data: 'task', type: 'text', width: 220 },
    { data: 'owner', type: 'text', width: 120 },
    {
      data: 'status',
      type: 'dropdown',
      width: 120,
      source: ['active', 'pending', 'inactive'],
      strict: true,
      allowInvalid: false,
    },
  ],
  cells(row, _column, _prop) { /* Step 2 */ },
};

const hot = new Handsontable(container, hotOptions);
```

**Why `strict: true` and `allowInvalid: false`?**
- `strict: true` rejects any value that is not in the `source` list.
- `allowInvalid: false` rolls back the edit instead of saving the invalid value.
- Together they guarantee the Status column always holds a known value, so the class mapping always finds a match.

Handsontable runs a full render after every data change (including dropdown edits), which re-runs the `cells` callback automatically. Row colors stay in sync without any extra hooks or manual re-renders.

## Step 4: Write scoped CSS for each status

The `cells` callback places the class on each `<td>` element. Target `td.ht-demo-row-status-*` and scope every rule under your container ID (`#example1`) to prevent styles leaking to other tables on the page.

```css
/* Blue tint for active rows */
#example1 td.ht-demo-row-status-active {
  background-color: color-mix(
    in srgb,
    var(--ht-accent-color, #1a42e8) 12%,
    var(--ht-background-color, #ffffff)
  );
}

/* Amber tint for pending rows */
#example1 td.ht-demo-row-status-pending {
  background-color: color-mix(
    in srgb,
    var(--ht-warn-color, #ca8a04) 14%,
    var(--ht-background-color, #ffffff)
  );
}

/* Gray background and muted text for inactive rows */
#example1 td.ht-demo-row-status-inactive {
  background-color: var(--ht-background-secondary-color, #f3f4f6);
  color: var(--ht-foreground-secondary-color, #6b7280);
}
```

**Why `td.ht-demo-row-status-*` and not `.ht-demo-row-status-* td`?**

Handsontable applies the `className` you return from `cells` directly to the `<td>` element itself. The selector must therefore read as "a `<td>` that has this class", not "a `<td>` that is a child of something with this class".

**Why CSS custom properties (`var(--ht-...)`) with fallbacks?**
- Theme tokens (`--ht-accent-color`, `--ht-warn-color`, etc.) automatically adapt to light, dark, and custom Handsontable themes.
- The fallback values (`#1a42e8`, `#ca8a04`, ...) ensure colors work in environments that do not load a Handsontable theme.

**Why `color-mix()`?**
- `color-mix(in srgb, <color> 12%, <background>)` blends the accent color lightly into the background, creating a gentle tint rather than a solid block of color.
- The percentage controls intensity: lower means a subtler tint.

## Step 5: Flash feedback for rejected edits

With `allowInvalid: false`, Handsontable cancels the change and immediately resets `valid` back to `true` within the same microtask - before any render can happen. This means Handsontable's built-in `.htInvalid` red background **never appears**: by the time the re-render runs, the cell is already valid again.

To give the user some feedback that their edit was rejected, use the [`afterValidate`](@/api/hooks.md#aftervalidate) hook. It fires right after validation, while `isValid` is still `false`, giving you a brief window to add a temporary CSS class directly to the `<td>`:

```javascript
afterValidate(isValid, _value, row, prop) {
  if (isValid) {
    return;
  }

  const col = this.propToCol(prop);
  const td = this.getCell(row, col);

  if (!td) {
    return;
  }

  td.classList.add('ht-demo-invalid-flash');
  setTimeout(() => td.classList.remove('ht-demo-invalid-flash'), 800);
},
```

**Key points:**

- `this` is the Handsontable instance inside any hook defined in the settings object (use a regular function, not an arrow function).
- `this.propToCol(prop)` converts the property name (`'status'`) to a visual column index.
- `this.getCell(row, col)` returns the live `<td>` element at the visual row and column. It returns `null` if the row is outside the rendered viewport, so always guard with `if (!td)`.
- The class is added directly to the DOM - no re-render is needed.
- The `setTimeout` removes the class after 800 ms, returning the cell to its normal status color.

**Why not use `.htInvalid` directly?**

The `baseRenderer` adds `.htInvalid` only when `cellProperties.valid === false` at render time. With `allowInvalid: false`, Handsontable sets `valid` back to `true` before the render. The hook fires before that reset, so it is the only reliable place to catch the `isValid === false` signal.

Add a matching CSS rule with `!important` so it overrides the status tint and `color` is preserved:

```css
#example1 td.ht-demo-invalid-flash {
  background-color: var(--ht-cell-error-background-color, rgba(250, 77, 50, 0.2)) !important;
  color: inherit;
}
```

`--ht-cell-error-background-color` matches the same token used by `.htInvalid`, so the flash color is consistent with the theme.

## How It Works - Complete Flow

1. **Initial load**: Handsontable calls `cells` for every cell. The callback reads the Status value and returns a class. Each `<td>` gets the matching CSS class applied to it.
2. **CSS renders colors**: The scoped CSS rules tint each `<td>` according to its class.
3. **User selects a new status**: The dropdown editor commits the value to the data source.
4. **Handsontable re-renders**: The `cells` callback runs again. The new class replaces the old one on every cell in that row.
5. **Colors update instantly**: No extra hooks, no manual re-renders needed.
6. **User pastes or types an invalid value**: `afterValidate` fires with `isValid === false`. The hook adds `.ht-demo-invalid-flash` directly to the `<td>`. After 800 ms the class is removed and the status color returns. The invalid value is never committed.

## `cells` callback vs custom renderer

| Approach | Pros | Trade-offs |
| -------- | ---- | ---------- |
| **`cells` + `className`** | Styling lives in CSS. Works with all built-in cell types and editors. One callback covers all columns in the row. | You rely on Handsontable to merge `className` into the DOM. |
| **Custom [`renderer`](@/api/renderers.md)** | Full control of `innerHTML`, extra markup, and per-cell logic. | Row-wide styling requires duplicating logic across columns or wrapping the default renderer. |

You can combine both: use `cells` for row-level classes and a custom renderer only where cell content needs special HTML.

## What you learned

- How to use the `cells` callback to return a `className` for every cell in a row based on a status column value.
- Why scoped CSS classes work better than inline styles for row coloring -- they stay consistent with Handsontable themes and update automatically on re-render.
- How Handsontable calls `cells` again after every edit, so no extra hooks are needed to keep row colors accurate after the user changes a status.
- How to add a temporary flash class in `afterValidate` to signal an invalid value without interrupting the color logic.

## Next steps

- Explore [frozen summary row](@/recipes/rendering-styling/frozen-summary-row/frozen-summary-row.md) to pin a styled totals row at the bottom while keeping the data rows color-coded.
- Explore [sparkline cell renderer](@/recipes/rendering-styling/sparkline-cell-renderer/sparkline-cell-renderer.md) for a more advanced renderer that draws SVG charts inside individual cells.

## Related

- [Configuration options: cell and row metadata](@/guides/getting-started/configuration-options/configuration-options.md#set-cell-options)
- [`className` option](@/api/options.md#classname)
- [`cells` option](@/api/options.md#cells)

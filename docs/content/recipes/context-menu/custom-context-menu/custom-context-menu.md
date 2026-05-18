---
id: a3f7c819
title: Custom context menu actions
metaTitle: Custom context menu actions - JavaScript Data Grid | Handsontable
description: Learn how to add custom items to Handsontable's right-click context menu, including duplicate row, flag row, and copy row as JSON actions.
permalink: /recipes/context-menu/custom-context-menu
canonicalUrl: /recipes/context-menu/custom-context-menu
tags:
  - recipes
  - tutorial
  - context menu
  - custom actions
react:
  id: b8d2f419
  metaTitle: Custom context menu actions - React Data Grid | Handsontable
angular:
  id: c5e3a907
  metaTitle: Custom context menu actions - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Context Menu
type: how-to
---

In this tutorial, you will add custom items to the Handsontable right-click context menu. You will learn how to define custom actions alongside built-in menu items and how to control which built-in items appear.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --css 2

@[code](@/content/recipes/context-menu/custom-context-menu/javascript/example1.js)
@[code](@/content/recipes/context-menu/custom-context-menu/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/context-menu/custom-context-menu/react/example1.css)
@[code](@/content/recipes/context-menu/custom-context-menu/react/example1.jsx)
@[code](@/content/recipes/context-menu/custom-context-menu/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/context-menu/custom-context-menu/angular/example1.ts)
@[code](@/content/recipes/context-menu/custom-context-menu/angular/example1.html)
@[code](@/content/recipes/context-menu/custom-context-menu/angular/example1.css)

:::

:::

## Overview

**Difficulty:** Beginner
**Time:** ~15 minutes

Handsontable's context menu supports fully custom items alongside built-in ones. This recipe shows you how to add three practical actions -- **Duplicate row**, **Flag row**, and **Copy row as JSON** -- and how to keep only the built-in items you want.

## What You'll Build

A project-task grid where right-clicking a row reveals:

- **Duplicate row** - inserts an exact copy of the row directly below the selected one.
- **Flag row** / **Unflag row** - toggles a yellow highlight on the row to mark it for attention.
- **Copy row as JSON** - writes the row's data as a JSON string to the clipboard.
- A separator line dividing custom actions from built-in row operations.
- A curated set of built-in items (insert row above/below, remove row, undo, redo) with column-insert items removed.

## Before you begin

You need a working Handsontable instance. If you are starting fresh, install it first:

```bash
npm install handsontable
```

Then import and register all modules:

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 1: Set up the data and the flagged-row tracker

```javascript
const data = [
  { task: 'Deploy API v2', assignee: 'Alice Chen', status: 'In Progress', priority: 'High', dueDate: '2026-05-10' },
  // ...more rows
];

const flaggedRows = new Set();
```

**What's happening:**

- `data` is an array of row objects. Each object maps to one row in the grid.
- `flaggedRows` is a JavaScript `Set` that tracks which visual row indexes are currently flagged. A `Set` gives you O(1) add, delete, and lookup, which keeps the `cells` callback fast even with many rows.

## Step 2: Apply per-row CSS via the `cells` callback

```javascript
const hot = new Handsontable(container, {
  // ...
  cells(row) {
    if (flaggedRows.has(row)) {
      return { className: 'ht-flagged-row' };
    }
  },
  // ...
});
```

**What's happening:**

- Handsontable calls `cells(row, col, prop)` for every cell it renders. Returning an object from this callback merges its properties into the cell's meta.
- Returning `{ className: 'ht-flagged-row' }` tells Handsontable to add that CSS class to the `<td>` element of every cell in the flagged row.
- The CSS file defines `.ht-flagged-row { background-color: #fff9c4 !important; }`, which produces the yellow highlight.
- Because `cells` is called on every render, toggling a row in `flaggedRows` and then calling `hot.render()` is all you need -- no direct DOM manipulation required.

## Step 3: Configure the context menu with custom items

```javascript
contextMenu: {
  items: {
    duplicate_row: { name: 'Duplicate row', callback(key, selection) { ... } },
    flag_row:      { name() { ... }, callback(key, selection) { ... } },
    copy_row_as_json: { name: 'Copy row as JSON', callback(key, selection) { ... } },
    sep1: '-',
    row_above: { name: 'Insert row above' },
    row_below: { name: 'Insert row below' },
    remove_row: { name: 'Remove row' },
    sep2: '-',
    undo: { name: 'Undo' },
    redo: { name: 'Redo' },
  },
},
```

**What's happening:**

- Passing an object to `contextMenu.items` gives you full control. The keys you list are the only items that appear -- anything omitted (including `col_left` and `col_right`) is hidden.
- Custom items use any key string that does not clash with built-in keys. Here, `duplicate_row`, `flag_row`, and `copy_row_as_json` are all user-defined.
- Built-in items (`row_above`, `row_below`, `remove_row`, `undo`, `redo`) can be re-declared with a custom `name` to override the label, or listed as-is to use the default label.
- `'-'` (a string with a single hyphen) is the built-in separator token. Any key that maps to `'-'` renders as a visual divider.

## Step 4: Implement "Duplicate row"

```javascript
duplicate_row: {
  name: 'Duplicate row',
  callback(key, selection) {
    const row = selection[0].start.row;
    const rowData = hot.getSourceDataAtRow(hot.toPhysicalRow(row));

    hot.alter('insert_row_below', row, 1);
    hot.populateFromArray(row + 1, 0, [Object.values(rowData)]);
  },
},
```

**What's happening:**

1. `selection[0].start.row` is the visual row index of the right-clicked cell.
2. `hot.toPhysicalRow(row)` converts the visual index to a physical one. This is needed because sorting or filtering can reorder rows; `getSourceDataAtRow` expects a physical index.
3. `hot.getSourceDataAtRow(physicalRow)` returns the raw source object (e.g., `{ task: '...', assignee: '...' }`).
4. `hot.alter('insert_row_below', row, 1)` inserts one empty row directly below the clicked row.
5. `hot.populateFromArray(row + 1, 0, [Object.values(rowData)])` fills that new row with the original row's values. `populateFromArray` expects a 2-D array, so you wrap `Object.values(rowData)` in an outer array.

## Step 5: Implement "Flag row"

```javascript
flag_row: {
  name() {
    const row = this.getSelectedRangeLast()?.from.row;

    return flaggedRows.has(row) ? 'Unflag row' : 'Flag row';
  },
  callback(key, selection) {
    const row = selection[0].start.row;

    if (flaggedRows.has(row)) {
      flaggedRows.delete(row);
    } else {
      flaggedRows.add(row);
    }

    hot.render();
  },
},
```

**What's happening:**

- `name` can be a function. Handsontable calls it each time the menu opens, so the label updates dynamically. Inside `name`, `this` is the context menu instance; `this.getSelectedRangeLast()?.from.row` reads the hovered row to show the correct label ("Flag row" or "Unflag row") before the user clicks.
- In `callback`, you add or remove the row from `flaggedRows`, then call `hot.render()`. The re-render triggers the `cells` callback, which returns `className: 'ht-flagged-row'` for flagged rows and nothing for unflagged ones, so the highlight appears or disappears immediately.

## Step 6: Implement "Copy row as JSON"

```javascript
copy_row_as_json: {
  name: 'Copy row as JSON',
  callback(key, selection) {
    const row = selection[0].start.row;
    const rowData = hot.getSourceDataAtRow(hot.toPhysicalRow(row));

    navigator.clipboard.writeText(JSON.stringify(rowData));
  },
},
```

**What's happening:**

- `JSON.stringify(rowData)` serializes the source object for that row (e.g., `{"task":"Deploy API v2","assignee":"Alice Chen",...}`).
- `navigator.clipboard.writeText(...)` writes the string to the system clipboard asynchronously. It requires a secure context (HTTPS or localhost) and returns a `Promise`; you can add `.catch(...)` to handle permission errors in production.

## How It Works - Complete Flow

1. User right-clicks a cell. Handsontable opens the context menu and calls each item's `name` function (if it is a function) to render labels.
2. The menu shows the three custom items, a separator, and the selected built-in items. Column-insert items are absent because they were not listed.
3. **Duplicate row**: `alter` shifts existing rows down, then `populateFromArray` copies the source data into the new row.
4. **Flag row** / **Unflag row**: The `flaggedRows` Set is updated, `hot.render()` fires the `cells` callback for every visible cell, and the CSS class is added or removed.
5. **Copy row as JSON**: Source data is serialized and written to the clipboard without modifying the grid.

## What you learned

- Pass an object to `contextMenu.items` to control exactly which items appear. Omitted keys -- including built-in ones like `col_left` -- are hidden.
- Use a string key like `'duplicate_row'` for custom items. The key must not clash with built-in keys.
- `callback(key, selection)` receives the item key and an array of selection ranges. `selection[0].start.row` gives you the right-clicked visual row.
- Convert visual to physical row with `hot.toPhysicalRow(row)` before calling `hot.getSourceDataAtRow()`.
- Use `name` as a function to return a dynamic label based on current state.
- The `cells` callback + `hot.render()` is the idiomatic way to apply per-row styling without touching the DOM directly.
- `'-'` as an item value inserts a visual separator.

## Next steps

- Add a `disabled()` function to any item to make it conditionally unavailable. Return `true` to grey out the item and prevent its callback from firing.
- Explore the [Context menu guide](@/guides/accessories-and-menus/context-menu/context-menu.md) for the full list of built-in item keys and advanced configuration.
- To add the same custom actions to the column dropdown menu, configure `dropdownMenu.items` using the same structure.

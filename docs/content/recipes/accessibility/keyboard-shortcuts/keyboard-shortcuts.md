---
id: a3f82c19
title: Custom keyboard shortcuts
metaTitle: Custom keyboard shortcuts - JavaScript Data Grid | Handsontable
description: Register custom keyboard shortcuts in Handsontable using the ShortcutManager API. Add Ctrl+D to duplicate rows and Ctrl+Enter to submit grid data.
permalink: /recipes/accessibility/keyboard-shortcuts
canonicalUrl: /recipes/accessibility/keyboard-shortcuts
tags:
  - keyboard shortcuts
  - ShortcutManager
  - accessibility
  - recipes
  - tutorial
react:
  id: b2e91d30
  metaTitle: Custom keyboard shortcuts - React Data Grid | Handsontable
angular:
  id: c4f03e47
  metaTitle: Custom keyboard shortcuts - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Accessibility & UX
type: tutorial
---

In this tutorial, you will register custom keyboard shortcuts in Handsontable using the ShortcutManager API. You will learn how to add shortcuts like Ctrl+D to duplicate rows and Ctrl+Enter to submit grid data without conflicting with existing browser or grid shortcuts.

::: only-for javascript

::: example #example1 :hot-recipe --html 1 --js 2 --css 3

@[code](@/content/recipes/accessibility/keyboard-shortcuts/javascript/example1.html)
@[code](@/content/recipes/accessibility/keyboard-shortcuts/javascript/example1.js)
@[code](@/content/recipes/accessibility/keyboard-shortcuts/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2 --css 3

@[code](@/content/recipes/accessibility/keyboard-shortcuts/react/example1.jsx)
@[code](@/content/recipes/accessibility/keyboard-shortcuts/react/example1.tsx)
@[code](@/content/recipes/accessibility/keyboard-shortcuts/react/example1.css)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/accessibility/keyboard-shortcuts/angular/example1.ts)
@[code](@/content/recipes/accessibility/keyboard-shortcuts/angular/example1.html)
@[code](@/content/recipes/accessibility/keyboard-shortcuts/angular/example1.css)

:::

:::

## Overview

**Difficulty:** Beginner
**Time:** ~15 minutes

Handsontable's `ShortcutManager` API lets you register custom keyboard shortcuts that fire only when the grid has focus. This recipe shows how to add two common shortcuts: `Ctrl+D` to duplicate a selected row, and `Ctrl+Enter` to collect and submit the grid's data.

## What You'll Build

A grid with two custom shortcuts:

- `Ctrl+D` -- duplicates the currently selected row and inserts the copy directly below it.
- `Ctrl+Enter` -- reads all grid data and displays a submission summary below the grid.
- A brief notification that appears on-screen after each shortcut fires.
- A log area that shows the last submit action.

## Before you begin

This recipe requires no extra dependencies beyond Handsontable itself. You should be familiar with:

- Creating a basic Handsontable instance.
- Reading cell data with `hot.getData()` and `hot.getSourceDataAtRow()`.
- Modifying rows with `hot.alter()` and `hot.populateFromArray()`.

## Step 1: Set up the grid

Import Handsontable, register all modules, and initialize the grid with your data.

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data: employees,
  colHeaders: ['Name', 'Department', 'Role', 'Salary', 'Start Date'],
  columns: [
    { data: 'name', type: 'text' },
    { data: 'department', type: 'text' },
    { data: 'role', type: 'text' },
    { data: 'salary', type: 'numeric', numericFormat: { pattern: '$0,0' } },
    { data: 'startDate', type: 'text' },
  ],
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:**

- `registerAllModules()` registers all built-in cell types, editors, renderers, and plugins -- including the `ShortcutManager`.
- The grid uses an array of objects as its data source. Each property maps to a column via the `data` key.

## Step 2: Access the ShortcutManager and grid context

```javascript
const shortcutManager = hot.getShortcutManager();
const gridContext = shortcutManager.getContext('grid');
```

**What's happening:**

- `hot.getShortcutManager()` returns the `ShortcutManager` instance attached to this grid.
- `shortcutManager.getContext('grid')` returns the `'grid'` context -- the context that is active whenever the grid has keyboard focus. Shortcuts registered here fire only while the user is interacting with the grid.

**Why a context?** Handsontable uses contexts to scope shortcuts. The `'grid'` context is the default active context when the grid has focus. Other contexts (for example `'editor'`) become active when a cell editor is open, so your custom grid shortcuts do not interfere with text input.

## Step 3: Register Ctrl+D to duplicate a row

```javascript
gridContext.addShortcut({
  keys: [['Control', 'd']],
  group: 'customActions',
  runOnlyIf: () => hot.getSelected() !== undefined,
  callback: (event) => {
    event.preventDefault();

    const selectedRange = hot.getSelectedRangeLast();

    if (!selectedRange) {
      return;
    }

    const row = selectedRange.from.row;
    const rowData = hot.getSourceDataAtRow(row);

    hot.alter('insert_row_below', row);
    hot.populateFromArray(row + 1, 0, [Object.values(rowData)]);
  },
});
```

**What's happening:**

- `keys: [['Control', 'd']]` -- an array of key combinations. Each inner array is one combination; multiple inner arrays mean "any of these combinations". Key names match the `KeyboardEvent.key` property (case-insensitive, with `Control`, `Alt`, `Shift`, and `Meta` as modifiers).
- `group: 'customActions'` -- a logical group name. Groups let you remove or disable multiple shortcuts at once.
- `runOnlyIf: () => hot.getSelected() !== undefined` -- a guard function. The callback fires only when this function returns `true`. Here it ensures at least one cell is selected before the shortcut does anything.
- `event.preventDefault()` -- prevents the browser's default behavior for `Ctrl+D` (which bookmarks the page in some browsers).
- `hot.getSelectedRangeLast()` -- returns a `CellRange` describing the last selection. `.from.row` gives the top row of that selection (visual index).
- `hot.getSourceDataAtRow(row)` -- reads the raw source data object for that row, bypassing any column sorting or filtering.
- `hot.alter('insert_row_below', row)` -- inserts a new empty row immediately below the selected row.
- `hot.populateFromArray(row + 1, 0, [Object.values(rowData)])` -- fills the new row with the original row's values. `populateFromArray` expects a 2-D array, so wrap the flat values array in an outer array.

## Step 4: Register Ctrl+Enter to submit the grid data

```javascript
gridContext.addShortcut({
  keys: [['Control', 'Enter']],
  group: 'customActions',
  runOnlyIf: () => true,
  callback: (event) => {
    event.preventDefault();

    const data = hot.getData();
    const headers = hot.getColHeader();
    const rowCount = data.length;
    const timestamp = new Date().toLocaleTimeString();

    submitLog.textContent =
      `[${timestamp}] Submitted ${rowCount} rows -- columns: ${headers.join(', ')}`;
  },
});
```

**What's happening:**

- `keys: [['Control', 'Enter']]` -- fires on `Ctrl+Enter`. In a standard HTML form, `Enter` submits, but inside a data grid you often want to capture `Ctrl+Enter` for a deliberate "submit all" action.
- `event.preventDefault()` -- in some browsers `Ctrl+Enter` can trigger form submission or other default behavior; this prevents it.
- `hot.getData()` -- returns a 2-D array of all visible cell values (respecting column and row order after sorting or filtering).
- `hot.getColHeader()` -- returns the current column header labels as an array.
- The summary string is written to the `#submit-log` element below the grid. In a real application you would replace this with a `fetch()` call or a Redux action.

## Step 5: (Optional) Remove a built-in shortcut

If a built-in shortcut conflicts with your custom one, remove it before registering yours:

```javascript
// Remove the built-in Delete key shortcut (clears cell content)
shortcutManager.getContext('grid').removeShortcutsByKeys([['Delete']]);
```

**Why use `removeShortcutsByKeys` instead of overwriting?** Handsontable checks for key conflicts at registration time. Removing the built-in shortcut first prevents a console warning and ensures only your handler runs.

The table below lists the most commonly overridden built-in shortcuts:

| Keys | Default action |
|---|---|
| `Delete` | Clear cell content |
| `Backspace` | Clear cell content |
| `Enter` | Open cell editor / move down |
| `Tab` | Move focus to next cell |
| `Escape` | Cancel editing |
| `Control+A` | Select all cells |
| `Control+Z` | Undo |
| `Control+Y` | Redo |
| `Control+C` | Copy selection |
| `Control+V` | Paste |

## How It Works - Complete Flow

1. **Grid renders** -- `ShortcutManager` initializes with the `'grid'` context and all built-in shortcuts already registered.
2. **User focuses the grid** -- the `'grid'` context becomes active; your custom shortcuts are now listening.
3. **User presses Ctrl+D** -- `ShortcutManager` matches the key combination against registered handlers. The `runOnlyIf` guard runs first. If a row is selected, the callback fires: the selected row is read, a new row is inserted below, and the copy is populated.
4. **User presses Ctrl+Enter** -- `ShortcutManager` matches `Ctrl+Enter`, calls `event.preventDefault()`, reads `hot.getData()`, and writes a summary to the log.
5. **User focuses outside the grid** -- the `'grid'` context deactivates; your shortcuts no longer fire.

## What you learned

- How to retrieve the `ShortcutManager` with `hot.getShortcutManager()`.
- How to target the `'grid'` context with `shortcutManager.getContext('grid')`.
- How to register a custom shortcut with `addShortcut({ keys, group, runOnlyIf, callback })`.
- How to guard shortcuts with `runOnlyIf` so they only fire when conditions are met.
- How to duplicate a row using `hot.alter()` and `hot.populateFromArray()`.
- How to collect grid data with `hot.getData()` for a submit action.
- How to prevent browser defaults with `event.preventDefault()`.
- How to remove a built-in shortcut with `removeShortcutsByKeys()`.

## Next steps

- Explore the full [Keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md) guide to see all built-in shortcuts.
- Use `context.addShortcut` with `keys: [['Control', 'z'], ['Meta', 'z']]` to support both Windows (`Ctrl`) and macOS (`Cmd`) modifiers in a single registration.
- Register shortcuts in the `'editor'` context to intercept key presses while a cell is being edited.
- Combine `runOnlyIf` with `hot.isEmptyRow()` or custom selection checks to build context-sensitive shortcut menus.

---
type: reference
title: Undo and redo
metaTitle: Undo and redo - JavaScript Data Grid | Handsontable
description: Revert and restore your changes, using the undo and redo features.
permalink: /undo-redo
canonicalUrl: /undo-redo
tags:
  - history of changes
  - state history
  - stack update
  - repeat
  - reverse
  - erase last change
  - roll back changes
react:
  metaTitle: Undo and redo - React Data Grid | Handsontable
angular:
  metaTitle: Undo and redo - Angular Data Grid | Handsontable
vue:
  metaTitle: Undo and redo - Vue Data Grid | Handsontable
searchCategory: Guides
category: Accessories and menus
menuTag: updated
---
Revert and restore your changes, using the undo and redo features.

[[toc]]

## Overview

The [`UndoRedo`](@/api/undoRedo.md) plugin records the actions you take in the grid and stores them in undo and redo stacks.

You can use keyboard shortcuts, the context menu, or API methods to move backward and forward through that history.

The plugin is enabled by default. When the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md) is enabled, its default items include **Undo** and **Redo**.

## Basic demo

Make a few edits in the grid.

Press <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Z**</kbd> to undo your last action.

Press <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Y**</kbd> (or <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd>) to redo it.

::: only-for javascript

::: example #example --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/undo-redo/javascript/example.js)
@[code](@/content/guides/accessories-and-menus/undo-redo/javascript/example.ts)

:::

:::


::: only-for react

::: example #example :react --js 1 --ts 2

@[code](@/content/guides/accessories-and-menus/undo-redo/react/example.jsx)
@[code](@/content/guides/accessories-and-menus/undo-redo/react/example.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/accessories-and-menus/undo-redo/angular/example1.ts)
@[code](@/content/guides/accessories-and-menus/undo-redo/angular/example1.html)

:::

:::

::: only-for vue

::: example #example :vue3

@[code](@/content/guides/accessories-and-menus/undo-redo/vue/example.vue)

:::

:::

## What UndoRedo tracks

UndoRedo records every action you take in the grid, whether you use the UI or the API. Each action is one undo step.

The tracked actions include:

- Cell value changes: editing, pasting, autofill, clearing cells, and API calls such as [`setDataAtCell()`](@/api/core.md#setdataatcell), [`populateFromArray()`](@/api/core.md#populatefromarray), and [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell).
- Inserting and removing rows and columns.
- [Sorting](@/guides/rows/rows-sorting/rows-sorting.md) and [filtering](@/guides/columns/column-filter/column-filter.md).
- [Moving rows](@/guides/rows/row-moving/row-moving.md), [moving columns](@/guides/columns/column-moving/column-moving.md), and moving cells, when the [`moveCells`](@/api/options.md#movecells) option is enabled.
- Merging and unmerging cells, and changing cell alignment.
- Cell metadata written with [`setCellMeta()`](@/api/core.md#setcellmeta) or [`removeCellMeta()`](@/api/core.md#removecellmeta), for example a `className` or a `readOnly` flag.
- Making cells read-only or writable through the **Read only** item of the context menu or the column menu. The whole selection is one step.
- [Hiding and showing rows](@/guides/rows/row-hiding/row-hiding.md) and [columns](@/guides/columns/column-hiding/column-hiding.md), and [trimming rows](@/guides/rows/row-trimming/row-trimming.md).
- [Resizing rows](@/guides/rows/row-height/row-height.md) and [columns](@/guides/columns/column-width/column-width.md), through the API or by dragging a header. A whole drag is one step.
- [Freezing and unfreezing columns](@/guides/columns/column-freezing/column-freezing.md).
- Collapsing and expanding [nested rows](@/guides/rows/row-parent-child/row-parent-child.md), adding a child row, and detaching a row from its parent.
- Collapsing and expanding [collapsible column headers](@/guides/columns/column-groups/column-groups.md).
- [Custom borders](@/guides/cell-features/formatting-cells/formatting-cells.md).
- [Comments](@/guides/cell-features/comments/comments.md): adding, editing, and removing a comment, and making it read-only.
- The [pagination](@/guides/rows/rows-pagination/rows-pagination.md) page and page size.

## One action, one undo step

UndoRedo records everything a single action changes as one step. When a paste adds rows to satisfy [`minSpareRows`](@/api/options.md#minsparerows), one undo removes the pasted values and the added rows together.

Calls you group with [`batch()`](@/api/core.md#batch) are one step too. The step's `actionType` is `'batch'`.

```js
// One undo reverts the edit, the removal, and the sort
hot.batch(() => {
  hot.setDataAtCell(0, 0, 'New value');
  hot.alter('remove_row', 5);
  hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
});
```

To group your own changes without suspending rendering, use [`runOperation()`](@/api/core.md#runoperation). The operation name becomes the step's `actionType`, and the source is passed to the stack hooks.

```js
hot.runOperation('import', 'myImport', () => {
  hot.setDataAtCell(0, 0, 'A');
  hot.setDataAtCell(1, 0, 'B');
  hot.alter('remove_row', 5);
});
```

Operations nest. A `batch()` or `runOperation()` call inside another one joins the outer step.

An edit that waits for an asynchronous [validator](@/guides/cell-functions/cell-validator/cell-validator.md) is recorded when the validation finishes. So when two edits overlap, the undo stack holds them in the order they finished. When a validator rejects every change of an edit, nothing is recorded.

## How an undo restores the grid

For each step, UndoRedo stores the grid state before and after the action, and a record of the values and the cell metadata the action changed. The grid state covers the row and column order, the hidden and trimmed rows and columns, the sizes, the sort order, the filter conditions, the merged cells, and the state of the other plugins. An undo puts back the state from before the action, and a redo puts back the state from after it.

An undo puts each value back on the record you edited, even when that row was moved, sorted, filtered, or trimmed since. Handsontable writes the value straight to the source data. Four things follow from that:

- [`beforeChange`](@/api/hooks.md#beforechange) does not run for restored values, and neither does a cell's `valueSetter`. The restored value is the value the source data held.
- [`afterChange`](@/api/hooks.md#afterchange) runs once per undo or redo, with every visible cell the restore wrote and the `UndoRedo.undo` or `UndoRedo.redo` source. [`afterSetSourceDataAtCell`](@/api/hooks.md#aftersetsourcedataatcell) runs too.
- Handsontable validates the restored visible cells again. The value stays as restored, and only the cell's `valid` state is updated.
- A restored filter or sort is not recalculated. The grid shows the rows exactly as they were.

An undo or a redo does not run the action again, so the action's own hooks -- such as [`beforeColumnSort`](@/api/hooks.md#beforecolumnsort), [`beforeFilter`](@/api/hooks.md#beforefilter), [`beforeRowMove`](@/api/hooks.md#beforerowmove), or [`beforeMoveCells`](@/api/hooks.md#beforemovecells) -- do not fire and cannot cancel it. To cancel an undo or a redo, return `false` from [`beforeUndo`](@/api/hooks.md#beforeundo) or [`beforeRedo`](@/api/hooks.md#beforeredo).

Rows and columns that an undo or a redo adds or removes do go through the row and column hooks, such as [`beforeCreateRow`](@/api/hooks.md#beforecreaterow) and [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow). When one of those hooks returns `false`, Handsontable puts the grid back as it was, the step stays on its stack, and `afterUndo` or `afterRedo` does not fire.

## Hooks and stack lifecycle

UndoRedo exposes hooks for both stack updates and action execution:

- Stack update hooks: [`beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), and [`afterRedoStackChange`](@/api/hooks.md#afterredostackchange).
- Action hooks: [`beforeUndo`](@/api/hooks.md#beforeundo), [`afterUndo`](@/api/hooks.md#afterundo), [`beforeRedo`](@/api/hooks.md#beforeredo), and [`afterRedo`](@/api/hooks.md#afterredo).

You can return `false` from `beforeUndoStackChange`, `beforeUndo`, or `beforeRedo` to block recording or execution.

The action hooks receive the step. Every step has these properties:

- `actionType`: the name of the action, for example `'change'`, `'remove_row'`, `'col_move'`, `'hide_rows'`, or `'batch'`.
- `source`: the source of the action.
- `operations` and `sources`: the name and the source of every operation the step contains, in order.

Some action types add their own properties. A `'change'` step has `changes` (an array of `[row, column, oldValue, newValue]`, with visual indexes, in the order the cells were passed) and `selected`. A `'remove_row'` step has `index`, `amount`, `indexes`, and `data`.

Both stacks are cleared when:

- You call [`loadData()`](@/api/core.md#loaddata) or [`updateData()`](@/api/core.md#updatedata). The recorded steps describe the dataset those methods replace.
- You turn on or turn off, at runtime, a plugin that hides, trims, or reorders rows or columns -- for example with `updateSettings({ hiddenRows: true })`. Passing a plugin's settings again, as a framework wrapper does on every render, keeps the stacks.
- The number of rows or columns changes outside any recorded action, for example through [`updateSettings()`](@/api/core.md#updatesettings) with a new [`columns`](@/api/options.md#columns) array.
- You disable the plugin or destroy the grid.

## Limit the history

By default, the undo stack has no size limit. To keep only the most recent steps, set [`undo`](@/api/options.md#undo) to an object with a `maxHistory` number. Once the stack grows past the limit, UndoRedo drops the oldest step.

```js
const hot = new Handsontable(container, {
  undo: {
    maxHistory: 100,
  },
});
```

## Programmatic control

Use the plugin instance to inspect and control history:

```js
const undoRedo = hot.getPlugin('undoRedo');

if (undoRedo.isUndoAvailable()) {
  undoRedo.undo();
}

if (undoRedo.isRedoAvailable()) {
  undoRedo.redo();
}

undoRedo.clear();
```

## Registering a custom undoable action

Everything you change in the grid is recorded for you. Use [`done()`](@/api/undoRedo.md#done) for state that lives outside the grid, so that one undo stack covers both.

Call `done()` with a function that returns an action object. The action object needs an `undo()` method and a `redo()` method, each receiving the Handsontable instance and a callback to call once the operation finishes.

```js
const favoriteRows = new Set();

function toggleFavoriteRow(row) {
  const undoRedo = hot.getPlugin('undoRedo');
  const toggle = () => {
    if (favoriteRows.has(row)) {
      favoriteRows.delete(row);
    } else {
      favoriteRows.add(row);
    }

    hot.render();
  };

  undoRedo.done(() => ({
    actionType: 'favoriteRow',
    undo(instance, callback) {
      toggle();
      callback();
    },
    redo(instance, callback) {
      toggle();
      callback();
    },
  }), 'favoriteRow');

  toggle();
}
```

After you call `toggleFavoriteRow()`, pressing <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Z**</kbd> reverts the change, and pressing <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Y**</kbd> reapplies it.

Do not register a change to the grid with `done()`. UndoRedo already records it, so the change would take two undo steps.

## Undo and redo with formulas

With the [`Formulas`](@/api/formulas.md) plugin, the grid's undo stack covers the formula engine too. An undo restores the formulas and the values in the grid, and Handsontable updates the engine to match.

The engine's own undo stack is not used. If you call HyperFormula's `undo()` or `redo()` yourself on an engine that a grid is connected to, the grid and the engine get out of sync. Use the grid's undo instead.

## Known limitations

UndoRedo does not record every change.

The following changes are not recorded:

- The size of a comment box that you resize by dragging.
- A page change in a grid whose pages come from a server through the [`dataProvider`](@/api/options.md#dataprovider) option.
- Merges applied from the [`mergeCells`](@/api/options.md#mergecells) setting. Merges and unmerges done through the context menu, the keyboard shortcut, and the plugin's [`merge()`](@/api/mergeCells.md#merge) and [`unmerge()`](@/api/mergeCells.md#unmerge) methods are recorded.
- Rows and columns that Handsontable adds on its own to satisfy [`minRows`](@/api/options.md#minrows), [`minCols`](@/api/options.md#mincols), [`minSpareRows`](@/api/options.md#minsparerows), or [`minSpareCols`](@/api/options.md#minsparecols), outside any action. They carry the `auto` source, which UndoRedo skips. Rows added this way during an edit are part of that edit's step.
- Sizes that Handsontable calculates, such as the ones from [`autoRowSize`](@/api/options.md#autorowsize), [`autoColumnSize`](@/api/options.md#autocolumnsize), and [`stretchH`](@/api/options.md#stretchh).
- Changes you make to the data array directly, without the Handsontable API.

Two more behaviors to plan for:

- An undo of an action that inserted or removed rows or columns puts back the hidden, trimmed, and ordered rows and columns as they were when the action ran. A hide or a trim applied with `updateSettings()` after that action is lost on the undo.
- In a [nested rows](@/guides/rows/row-parent-child/row-parent-child.md) grid, a `batch()` that both moves or detaches rows and edits cells can put an edit on another row when you undo it.

## Related keyboard shortcuts

| Windows                                                       | macOS                                                        | Action               |  Excel  | Sheets  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd>+<kbd>**Z**</kbd>                        | <kbd>⌘</kbd>+<kbd>**Z**</kbd>                        | Undo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Y**</kbd>                        | <kbd>⌘</kbd>+<kbd>**Y**</kbd>                        | Redo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd> | <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>**Z**</kbd> | Redo the last action | &check; | &check; |

## Related blog articles

<div class="boxes-list gray">

- [Handsontable 14.6.0: Easier styling and enhanced Undo/Redo](https://handsontable.com/blog/handsontable-14-6-0-easier-styling-and-enhanced-undo-redo)

</div>

## Related API reference

**Configuration options**

<div class="boxes-list">

- [undo](@/api/options.md#undo)

</div>

**Core methods**

<div class="boxes-list">

- [batch()](@/api/core.md#batch)
- [runOperation()](@/api/core.md#runoperation)

</div>

**Hooks**

<div class="boxes-list">

- [afterRedo](@/api/hooks.md#afterredo)
- [afterRedoStackChange](@/api/hooks.md#afterredostackchange)
- [afterUndo](@/api/hooks.md#afterundo)
- [afterUndoStackChange](@/api/hooks.md#afterundostackchange)
- [beforeRedo](@/api/hooks.md#beforeredo)
- [beforeRedoStackChange](@/api/hooks.md#beforeredostackchange)
- [beforeUndo](@/api/hooks.md#beforeundo)
- [beforeUndoStackChange](@/api/hooks.md#beforeundostackchange)

</div>

**Plugins**

<div class="boxes-list">

- [UndoRedo](@/api/undoRedo.md)

</div>

Microsoft and Excel are registered trademarks of Microsoft Corporation. Google Sheets is a trademark of Google LLC.

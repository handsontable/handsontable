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

The [`UndoRedo`](@/api/undoRedo.md) plugin records supported grid operations and stores them in undo and redo stacks.

You can use keyboard shortcuts or call API methods to move backward and forward through that history.

The plugin is enabled by default.

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

UndoRedo tracks operations that emit dedicated hooks and register an action in the plugin.

The built-in tracked actions include:

- Cell value changes (`beforeChange`)
- Row and column insertion/removal (`afterCreateRow`, `afterCreateCol`, `beforeRemoveRow`, `beforeRemoveCol`)
- Column sorting (`beforeColumnSort`)
- Filtering (`beforeFilter`)
- Row and column moving (`beforeRowMove`, `beforeColumnMove`)
- Merge and unmerge (`beforeMergeCells`, `afterUnmergeCells`)
- Alignment changes (`beforeCellAlignment`)

## Batch edits and multi-cell changes

For data edits, UndoRedo records only effective changes:

- Entries nullified by other `beforeChange` hooks are skipped.
- If a single cell changed, UndoRedo restores selection to that cell.
- If multiple cells changed in one operation, UndoRedo restores the full selection range.

When you undo a data-change action, Handsontable can also remove rows or columns that were created as a side effect of that edit, and then restore the previous selection.

## Hooks and stack lifecycle

UndoRedo exposes hooks for both stack updates and action execution:

- Stack update hooks: [`beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange), [`afterUndoStackChange`](@/api/hooks.md#afterundostackchange), [`beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange), and [`afterRedoStackChange`](@/api/hooks.md#afterredostackchange).
- Action hooks: [`beforeUndo`](@/api/hooks.md#beforeundo), [`afterUndo`](@/api/hooks.md#afterundo), [`beforeRedo`](@/api/hooks.md#beforeredo), and [`afterRedo`](@/api/hooks.md#afterredo).

You can return `false` from `beforeUndoStackChange`, `beforeUndo`, or `beforeRedo` to block recording or execution.

Calling `loadData()` clears both stacks.

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

Use [`done()`](@/api/undoRedo.md#done) to add an action to the undo stack that isn't tracked by default, such as a direct [`setCellMeta()`](@/api/core.md#setcellmeta) update.

Call `done()` with a function that returns an action object. The action object needs an `undo()` method and a `redo()` method, each receiving the Handsontable instance and a callback to call once the operation finishes.

```js
function setCellBackgroundColor(row, col, className) {
  const undoRedo = hot.getPlugin('undoRedo');
  const previousClassName = hot.getCellMeta(row, col).className;

  undoRedo.done(() => ({
    actionType: 'cellBackgroundColor',
    undo(instance, callback) {
      instance.setCellMeta(row, col, 'className', previousClassName);
      instance.render();
      callback();
    },
    redo(instance, callback) {
      instance.setCellMeta(row, col, 'className', className);
      instance.render();
      callback();
    },
  }), 'cellBackgroundColor');

  hot.setCellMeta(row, col, 'className', className);
  hot.render();
}
```

After you call `setCellBackgroundColor()`, pressing <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Z**</kbd> reverts the color change, and pressing <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Y**</kbd> reapplies it.

## Known limitations

UndoRedo does not record every possible operation.

The following operations are not tracked by default:

- [Column resizing](@/guides/columns/column-width/column-width.md) and [row resizing](@/guides/rows/row-height/row-height.md)
- [Hiding columns](@/guides/columns/column-hiding/column-hiding.md) and [hiding rows](@/guides/rows/row-hiding/row-hiding.md)
- [Trimming rows](@/guides/rows/row-trimming/row-trimming.md)
- Generic cell metadata changes that don't register an UndoRedo action (for example, most direct `setCellMeta()` updates)

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

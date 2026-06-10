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
---
Revert and restore your changes, using the undo and redo features.

[[toc]]

## Overview

This feature allows you to revert changes made in the data grid. It is very useful in a normal day-to-day routine, especially when the change is unintentional. This feature stacks the changes made with the user interface of the grid. Modifications done programmatically are omitted.

The basic methods are [`undo()`](@/api/undoRedo.md#undo) and [`redo()`](@/api/undoRedo.md#redo). The [`undo()`](@/api/undoRedo.md#undo) method rolls back the last performed action, and the [`redo()`](@/api/undoRedo.md#redo) method restores it.

This feature is provided by the [`UndoRedo`](@/api/undoRedo.md) plugin, and is enabled by default.

## Basic demo

Make some changes to the grid below and the use the <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Z**</kbd> command to redo the previous state. Then, use <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Y**</kbd> (or <kbd>**Ctrl**</kbd>/<kbd>⌘</kbd>+<kbd>**Shift**</kbd>+<kbd>**Z**</kbd>) to restore it.

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

## Known limitations

Not all user-triggered actions are recorded in the undo-and-redo history.
Here's the list of all unsupported features:

- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Row moving](@/guides/rows/row-moving/row-moving.md)

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

- [clearUndo()](@/api/core.md#clearundo)
- [isRedoAvailable()](@/api/core.md#isredoavailable)
- [isUndoAvailable()](@/api/core.md#isundoavailable)
- [redo()](@/api/core.md#redo)
- [undo()](@/api/core.md#undo)

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

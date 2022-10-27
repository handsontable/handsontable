---
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
searchCategory: Guides
---

# Undo and redo

Revert and restore your changes, using the undo and redo features.

[[toc]]

## Overview

This feature allows you to revert changes made in the data grid. It is very useful in a normal day-to-day routine, especially when the change is unintentional. This feature stacks the changes made with the user interface of the grid. Modifications done programmatically are omitted.

The basic methods are [`undo()`](@/api/undoRedo.md#undo) and [`redo()`](@/api/undoRedo.md#redo). The [`undo()`](@/api/undoRedo.md#undo) method rolls back the last performed action, and the [`redo()`](@/api/undoRedo.md#redo) method restores it.

This feature is provided by the [`UndoRedo`](@/api/undoRedo.md) plugin, and is enabled by default.

:::tip
Not all user-triggered actions are covered by this feature. See the below list of actions that won't be added to the history of changes:

- Sort
- Filter
- Move column
- Move row
:::

## Basic demo

Make some changes to the grid below and the use the <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Z**</kbd> command to redo the previous state. Then, use <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Y**</kbd> (or <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd>) to restore it.

::: only-for javascript
::: example #example
```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const container = document.querySelector('#example');
const hot = new Handsontable(container, {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
    ['A6', 'B6', 'C6', 'D6', 'E6'],
    ['A7', 'B7', 'C7', 'D7', 'E7'],
    ['A8', 'B8', 'C8', 'D8', 'E8'],
    ['A9', 'B9', 'C9', 'D9', 'E9'],
  ],
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation'
});
```
:::
:::

::: only-for react
::: example #example :react
```jsx
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
        ['A6', 'B6', 'C6', 'D6', 'E6'],
        ['A7', 'B7', 'C7', 'D7', 'E7'],
        ['A8', 'B8', 'C8', 'D8', 'E8'],
        ['A9', 'B9', 'C9', 'D9', 'E9'],
      ]}
      rowHeaders={true}
      colHeaders={true}
      stretchH="all"
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example'));
/* end:skip-in-preview */
```
:::
:::


## Related keyboard shortcuts

| Windows                                                       | macOS                                                        | Action               |  Excel  | Sheets  |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------- | :-----: | :-----: |
| <kbd>**Ctrl**</kbd> + <kbd>**Z**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**Z**</kbd>                        | Undo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Y**</kbd>                        | <kbd>**Cmd**</kbd> + <kbd>**Y**</kbd>                        | Redo the last action | &check; | &check; |
| <kbd>**Ctrl**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd> | <kbd>**Cmd**</kbd> + <kbd>**Shift**</kbd> + <kbd>**Z**</kbd> | Redo the last action | &check; | &check; |

## Related API reference

- Configuration options:
  - [`undo`](@/api/options.md#undo)
- Core methods:
  - [`clearUndo()`](@/api/core.md#clearundo)
  - [`isRedoAvailable()`](@/api/core.md#isredoavailable)
  - [`isUndoAvailable()`](@/api/core.md#isundoavailable)
  - [`redo()`](@/api/core.md#redo)
  - [`undo()`](@/api/core.md#undo)
- Hooks:
  - [`afterRedo`](@/api/hooks.md#afterredo)
  - [`afterRedoStackChange`](@/api/hooks.md#afterredostackchange)
  - [`afterUndo`](@/api/hooks.md#afterundo)
  - [`afterUndoStackChange`](@/api/hooks.md#afterundostackchange)
  - [`beforeRedo`](@/api/hooks.md#beforeredo)
  - [`beforeRedoStackChange`](@/api/hooks.md#beforeredostackchange)
  - [`beforeUndo`](@/api/hooks.md#beforeundo)
  - [`beforeUndoStackChange`](@/api/hooks.md#beforeundostackchange)
- Plugins:
  - [`UndoRedo`](@/api/undoRedo.md)

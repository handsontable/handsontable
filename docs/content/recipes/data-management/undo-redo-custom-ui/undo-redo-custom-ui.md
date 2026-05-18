---
id: e3a8f4c9
title: Undo / redo with a custom UI
metaTitle: Undo / redo with a custom UI - JavaScript Data Grid | Handsontable
description: Build external Undo and Redo buttons that stay in sync with Handsontable undo/redo stack availability.
permalink: /recipes/data-management/undo-redo-custom-ui
canonicalUrl: /recipes/data-management/undo-redo-custom-ui
tags:
  - guides
  - tutorial
  - recipes
  - undo
  - redo
  - custom ui
react:
  id: b7d1a2f6
  metaTitle: Undo / redo with a custom UI - React Data Grid | Handsontable
angular:
  id: c4e9b8a1
  metaTitle: Undo / redo with a custom UI - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

In this tutorial, you will build external Undo and Redo buttons that stay in sync with the Handsontable undo/redo stack. You will learn how to use `afterChange`, `afterUndo`, and `afterRedo` to keep button states accurate at all times.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2
@[code](@/content/recipes/data-management/undo-redo-custom-ui/javascript/example1.js)
@[code](@/content/recipes/data-management/undo-redo-custom-ui/javascript/example1.ts)
:::

:::

::: only-for react

::: example #example1 :react-advanced --js 1 --ts 2

@[code](@/content/recipes/data-management/undo-redo-custom-ui/react/example1.jsx)
@[code](@/content/recipes/data-management/undo-redo-custom-ui/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/recipes/data-management/undo-redo-custom-ui/angular/example1.ts)
@[code](@/content/recipes/data-management/undo-redo-custom-ui/angular/example1.html)

:::

:::

## Overview

This recipe shows how to connect external **Undo** and **Redo** buttons to Handsontable's built-in undo/redo stack. The buttons stay disabled until an action is available, and they update after every change, undo, and redo.

**Difficulty:** Beginner
**Time:** ~10 minutes
**Libraries:** None (pure Handsontable APIs)

## What You'll Build

A grid with two custom buttons rendered outside the table that:
- Call `hot.getPlugin('undoRedo').undo()` and `hot.getPlugin('undoRedo').redo()` on click.
- Read stack availability from `hot.getPlugin('undoRedo').isUndoAvailable()` and `hot.getPlugin('undoRedo').isRedoAvailable()`.
- Toggle disabled state reactively after `afterChange`, `afterUndo`, and `afterRedo`.

## Prerequisites

None.

## Step 1: Import dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();
```

## Step 2: Add external controls

Use a container with two buttons above the grid:

```html
<div class="undo-redo-controls">
  <button id="undo-button" type="button">Undo</button>
  <button id="redo-button" type="button">Redo</button>
</div>
<div id="example1"></div>
```

## Step 3: Enable undo/redo in grid settings

Turn on the plugin with `undoRedo: true`.

```typescript
const hot = new Handsontable(container, {
  data,
  rowHeaders: true,
  colHeaders: true,
  undoRedo: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

## Step 4: Wire custom button handlers

Attach click listeners that call the core APIs.

```typescript
undoButton.addEventListener('click', () => {
  hot.getPlugin('undoRedo').undo();
});

redoButton.addEventListener('click', () => {
  hot.getPlugin('undoRedo').redo();
});
```

## Step 5: Toggle button state from stack availability

Read plugin state and disable buttons when actions are unavailable.

```typescript
const syncHistoryButtons = () => {
  const undoRedoPlugin = hot.getPlugin('undoRedo');

  undoButton.disabled = !undoRedoPlugin.isUndoAvailable();
  redoButton.disabled = !undoRedoPlugin.isRedoAvailable();
};
```

## Step 6: Keep state in sync after every update

Run `syncHistoryButtons()` from all required hooks:

```typescript
afterChange: () => syncHistoryButtons(),
afterUndo: () => syncHistoryButtons(),
afterRedo: () => syncHistoryButtons(),
```

Also call it once after initialization so both buttons start disabled.

## Complete example

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const undoButton = document.querySelector('#undo-button') as HTMLButtonElement;
const redoButton = document.querySelector('#redo-button') as HTMLButtonElement;
const container = document.querySelector('#example1')!;

const data = [
  ['Task', 'Owner', 'Status'],
  ['Review PR', 'Alex', 'Done'],
  ['Update docs', 'Mira', 'In progress'],
  ['Plan release', 'Sam', 'Planned'],
];

const hot = new Handsontable(container, {
  data,
  rowHeaders: true,
  colHeaders: true,
  undoRedo: true,
  width: '100%',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

const syncHistoryButtons = () => {
  const undoRedoPlugin = hot.getPlugin('undoRedo');

  undoButton.disabled = !undoRedoPlugin.isUndoAvailable();
  redoButton.disabled = !undoRedoPlugin.isRedoAvailable();
};

undoButton.addEventListener('click', () => {
  hot.getPlugin('undoRedo').undo();
});

redoButton.addEventListener('click', () => {
  hot.getPlugin('undoRedo').redo();
});

hot.updateSettings({
  afterChange: () => syncHistoryButtons(),
  afterUndo: () => syncHistoryButtons(),
  afterRedo: () => syncHistoryButtons(),
});

syncHistoryButtons();
```

## How it works - complete flow

1. The grid starts with `undoRedo: true`.
2. Both buttons are disabled on load - the stack is empty.
3. After any edit, `afterChange` runs and enables **Undo**.
4. Clicking **Undo** calls `hot.getPlugin('undoRedo').undo()`, then `afterUndo` updates both buttons.
5. Clicking **Redo** calls `hot.getPlugin('undoRedo').redo()`, then `afterRedo` updates both buttons.
6. Button states always match the plugin stack.

## Related APIs

<div class="boxes-list">

- [undo()](@/api/undoRedo.md#undo)
- [redo()](@/api/undoRedo.md#redo)
- [UndoRedo](@/api/undoRedo.md)
- [afterChange](@/api/hooks.md#afterchange)
- [afterUndo](@/api/hooks.md#afterundo)
- [afterRedo](@/api/hooks.md#afterredo)

</div>

## What you learned

- How to enable the `UndoRedo` plugin with `undoRedo: true` in Handsontable settings.
- How to call `undo()` and `redo()` on the plugin instance from external button click handlers.
- How to use the `afterChange`, `afterUndo`, and `afterRedo` hooks to check `isUndoAvailable()` and `isRedoAvailable()` and keep button disabled states accurate.
- How to keep the undo/redo stack in sync with the UI so buttons always reflect the actual stack state.

## Next steps

- Add keyboard shortcuts (`Ctrl+Z`, `Ctrl+Shift+Z`) using the [ShortcutManager](@/guides/navigation/custom-shortcuts/custom-shortcuts.md) to supplement the buttons.
- Explore [auto-save changes to a backend](@/recipes/data-management/auto-save-backend/auto-save-backend.md) to persist changes after each successful undo/redo cycle.

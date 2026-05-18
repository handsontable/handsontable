---
id: j9r2m7x4
title: Auto-save changes to a backend
metaTitle: Auto-save changes to a backend - JavaScript Data Grid | Handsontable
description: Learn how to auto-save Handsontable edits with a debounced afterChange hook, dirty row tracking, and save status feedback.
permalink: /recipes/data-management/auto-save-backend
canonicalUrl: /recipes/data-management/auto-save-backend
tags:
  - guides
  - tutorial
  - recipes
  - autosave
  - data persistence
  - backend sync
react:
  id: p6t8v3n1
  metaTitle: Auto-save changes to a backend - React Data Grid | Handsontable
angular:
  id: b5c2q9k7
  metaTitle: Auto-save changes to a backend - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Data Management
type: how-to
---

In this tutorial, you will build an auto-save flow that sends grid edits to a backend after a debounce delay. You will learn how to use `afterChange`, dirty row tracking, and save status feedback to give users real-time confirmation of their changes.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3
@[code](@/content/recipes/data-management/auto-save-backend/javascript/example1.js)
@[code](@/content/recipes/data-management/auto-save-backend/javascript/example1.ts)
@[code](@/content/recipes/data-management/auto-save-backend/javascript/example1.css)
:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/data-management/auto-save-backend/react/example1.css)
@[code](@/content/recipes/data-management/auto-save-backend/react/example1.jsx)
@[code](@/content/recipes/data-management/auto-save-backend/react/example1.tsx)
:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/data-management/auto-save-backend/angular/example1.ts)
@[code](@/content/recipes/data-management/auto-save-backend/angular/example1.html)
@[code](@/content/recipes/data-management/auto-save-backend/angular/example1.css)

:::

:::

## Overview

This recipe shows how to auto-save edited rows to a backend with `afterChange`, an 800 ms debounce, and row-level dirty tracking. It sends only modified rows, ignores `loadData` changes, and reports save status in the UI.

**Difficulty:** Intermediate  
**Time:** ~20 minutes  
**Libraries:** None (mock backend included)

## What You'll Build

A grid that:
- Tracks edited rows in a dirty set.
- Batches rapid edits into one debounced save request.
- Sends only changed rows to a backend save function.
- Shows save state as **Saving...**, **Saved ✓**, or **Error**.
- Ignores `loadData` updates so initial data loading does not trigger saves.

## Step 1: Register modules and create sample data

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
  { id: 1, product: 'Keyboard', stock: 14, price: 89, status: 'active' },
  { id: 2, product: 'Monitor', stock: 5, price: 249, status: 'active' },
  { id: 3, product: 'Dock', stock: 22, price: 139, status: 'draft' },
  { id: 4, product: 'Webcam', stock: 9, price: 119, status: 'active' },
  { id: 5, product: 'Headset', stock: 16, price: 99, status: 'paused' },
];
```

Use object rows with a stable primary key (`id`) so each payload can identify records.

## Step 2: Add a save status element

```typescript
const statusEl = document.querySelector('#save-status');

function setSaveStatus(state: 'idle' | 'saving' | 'saved' | 'error') {
  if (!statusEl) {
    return;
  }

  const labels = {
    idle: 'No pending changes',
    saving: 'Saving...',
    saved: 'Saved ✓',
    error: 'Error',
  };

  statusEl.textContent = labels[state];
  statusEl.dataset.state = state;
}
```

This keeps save feedback separate from table logic.

## Step 3: Add a backend save function

```typescript
async function saveRowsToBackend(rows) {
  await new Promise((resolve) => setTimeout(resolve, 450));

  // Replace this with fetch('/api/products', { method: 'PATCH', body: ... }) in production.
  // eslint-disable-next-line no-console
  console.log('PATCH /api/products', rows);
}
```

Use a mock promise so the recipe works without extra setup.

## Step 4: Track dirty rows and debounce saves

```typescript
const dirtyRows = new Set<number>();
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let saveRequestCounter = 0;

function queueSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    const physicalRows = Array.from(dirtyRows);

    if (physicalRows.length === 0) {
      return;
    }

    const requestId = ++saveRequestCounter;
    const rowsToSave = physicalRows
      .map((physicalRow) => hot.getSourceDataAtRow(physicalRow))
      .filter((row): row is RowData => row !== undefined && row !== null);

    dirtyRows.clear();
    setSaveStatus('saving');

    try {
      await saveRowsToBackend(rowsToSave);

      if (requestId === saveRequestCounter) {
        setSaveStatus('saved');
      }
    } catch (_error) {
      physicalRows.forEach((physicalRow) => dirtyRows.add(physicalRow));

      if (requestId === saveRequestCounter) {
        setSaveStatus('error');
      }
    }
  }, 800);
}
```

The debounce batches fast edits into one request, and the dirty set prevents duplicate row saves.

## Step 5: Use `afterChange` and ignore `loadData`

```typescript
afterChange(changes, source) {
  if (!changes || source === 'loadData') {
    return;
  }

  changes.forEach(([visualRow, _prop, oldValue, newValue]) => {
    if (oldValue !== newValue) {
      const physicalRow = hot.toPhysicalRow(visualRow as number);

      if (typeof physicalRow === 'number') {
        dirtyRows.add(physicalRow);
      }
    }
  });

  queueSave();
}
```

This limits auto-save behavior to user edits and other non-load update sources.

## Step 6: Complete working example

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

type RowData = {
  id: number;
  product: string;
  stock: number;
  price: number;
  status: 'active' | 'draft' | 'paused';
};

const data: RowData[] = [
  { id: 1, product: 'Keyboard', stock: 14, price: 89, status: 'active' },
  { id: 2, product: 'Monitor', stock: 5, price: 249, status: 'active' },
  { id: 3, product: 'Dock', stock: 22, price: 139, status: 'draft' },
  { id: 4, product: 'Webcam', stock: 9, price: 119, status: 'active' },
  { id: 5, product: 'Headset', stock: 16, price: 99, status: 'paused' },
];

const container = document.querySelector('#example1');

if (container instanceof HTMLElement) {
  const statusEl = document.createElement('div');
  statusEl.id = 'save-status';
  container.before(statusEl);

  const dirtyRows = new Set<number>();
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let saveRequestCounter = 0;

  const setSaveStatus = (state: 'idle' | 'saving' | 'saved' | 'error') => {
    const labels = {
      idle: 'No pending changes',
      saving: 'Saving...',
      saved: 'Saved ✓',
      error: 'Error',
    };

    statusEl.textContent = labels[state];
    statusEl.dataset.state = state;
  };

  const saveRowsToBackend = async (rows: RowData[]) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    // eslint-disable-next-line no-console
    console.log('PATCH /api/products', rows);
  };

  const hot = new Handsontable(container, {
    data,
    rowHeaders: true,
    colHeaders: ['ID', 'Product', 'Stock', 'Price', 'Status'],
    columns: [
      { data: 'id', type: 'numeric', readOnly: true, width: 70 },
      { data: 'product', type: 'text', width: 180 },
      { data: 'stock', type: 'numeric', width: 90 },
      { data: 'price', type: 'numeric', numericFormat: { pattern: '$0,0.00' }, width: 110 },
      { data: 'status', type: 'text', width: 120 },
    ],
    stretchH: 'all',
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    afterChange(changes, source) {
      if (!changes || source === 'loadData') {
        return;
      }

      changes.forEach(([visualRow, _prop, oldValue, newValue]) => {
        if (oldValue !== newValue) {
          const physicalRow = hot.toPhysicalRow(visualRow as number);

          if (typeof physicalRow === 'number') {
            dirtyRows.add(physicalRow);
          }
        }
      });

      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      saveTimeout = setTimeout(async () => {
        const physicalRows = Array.from(dirtyRows);

        if (physicalRows.length === 0) {
          return;
        }

        const requestId = ++saveRequestCounter;
        const rowsToSave = physicalRows
          .map((physicalRow) => hot.getSourceDataAtRow(physicalRow))
          .filter((row): row is RowData => row !== undefined && row !== null);

        dirtyRows.clear();
        setSaveStatus('saving');

        try {
          await saveRowsToBackend(rowsToSave);

          if (requestId === saveRequestCounter) {
            setSaveStatus('saved');
          }
        } catch (_error) {
          physicalRows.forEach((physicalRow) => dirtyRows.add(physicalRow));

          if (requestId === saveRequestCounter) {
            setSaveStatus('error');
          }
        }
      }, 800);
    },
  });

  // Demonstrate that loadData updates do not trigger save requests.
  hot.loadData(data.map((row) => ({ ...row })));
  setSaveStatus('idle');
}
```

## How It Works - Save lifecycle

1. User edits one or more cells.
2. `afterChange` captures changed visual rows, but skips `source === 'loadData'`.
3. The debounce timer resets on each new edit.
4. After 800 ms without edits, only dirty rows are collected and sent.
5. The UI status changes from **Saving...** to **Saved ✓** (or **Error** on failure).

## Production tips

- Send stable IDs and changed fields only if your API accepts partial row updates.
- Replace the mock save with authenticated `fetch` calls and server-side validation.
- Add retry or backoff logic for transient network failures.
- Show the last successful save timestamp for better user confidence.

## What you learned

- How to use `afterChange` to react to grid edits and skip system-generated changes by checking the `source` argument.
- How debouncing limits the number of save requests when the user edits many cells in quick succession.
- How dirty row tracking lets you send only changed rows instead of the full dataset.
- How to provide visual feedback with a save status element that reflects idle, saving, saved, and error states.

## Next steps

- Replace the mock save with a real `fetch` call to your API endpoint.
- Add [undo/redo with a custom UI](@/recipes/data-management/undo-redo-custom-ui/undo-redo-custom-ui.md) to let users revert changes before they are auto-saved.
- Explore [server-side data with NestJS](@/recipes/data-management/server-side-nestjs/server-side-nestjs.md) for a full server-driven CRUD approach with the `dataProvider` plugin.

---
id: b3e7f2a1
title: Real-time cell updates via WebSocket
metaTitle: Real-time WebSocket Updates - JavaScript Data Grid | Handsontable
description: Learn how to connect Handsontable to a WebSocket and update individual cells in real time using setDataAtCell, without re-rendering the entire grid.
permalink: /recipes/real-time/websocket-updates
canonicalUrl: /recipes/real-time/websocket-updates
tags:
  - websocket
  - real-time
  - streaming
  - setDataAtCell
  - tutorial
  - recipes
react:
  id: c4f8a2e7
  metaTitle: Real-time WebSocket Updates - React Data Grid | Handsontable
angular:
  id: d9b1e5f3
  metaTitle: Real-time WebSocket Updates - Angular Data Grid | Handsontable
vue:
  id: fvoen1lx
  metaTitle: Real-time WebSocket Updates - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Real-time & Integrations
type: how-to
---

In this tutorial, you will connect Handsontable to a WebSocket and update individual cells in real time. You will learn how to use `setDataAtCell` to apply streaming updates without re-rendering the entire grid.

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --css 2

@[code](@/content/recipes/real-time/websocket-updates/javascript/example1.js)
@[code](@/content/recipes/real-time/websocket-updates/javascript/example1.css)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3

@[code](@/content/recipes/real-time/websocket-updates/react/example1.css)
@[code](@/content/recipes/real-time/websocket-updates/react/example1.jsx)
@[code](@/content/recipes/real-time/websocket-updates/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --css 3

@[code](@/content/recipes/real-time/websocket-updates/angular/example1.ts)
@[code](@/content/recipes/real-time/websocket-updates/angular/example1.html)
@[code](@/content/recipes/real-time/websocket-updates/angular/example1.css)

:::

:::

## Overview

**Difficulty:** Intermediate
**Time:** ~15 minutes

This recipe shows how to push individual cell updates into Handsontable from an external data source -- such as a WebSocket feed -- without re-rendering the entire grid on every event. The technique is applicable to any streaming data: stock prices, IoT sensors, live sports scores, and so on.

## What You'll Build

A live stock-price grid that:

- Receives price updates from a simulated WebSocket feed every 1.5 seconds.
- Applies each update to a single cell using `hot.setDataAtRowProp()`.
- Tags every programmatic update with the source string `'external'` so user edits remain distinguishable.
- Briefly flashes updated cells with a yellow highlight using a CSS animation.
- Cleans up the interval (or WebSocket connection) when the page is unloaded.

## Before you begin

You need a working Handsontable installation. If you are starting from scratch, follow the [Quick start](@/guides/getting-started/installation/installation.md) guide first.

No additional libraries are required for this recipe.

## Step 1: Set up the grid with financial data

Start by creating a Handsontable instance with stock-market data. The grid has six columns: Symbol, Company, Price, Change, Volume, and Market Cap.

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const stockData = [
  { symbol: 'AAPL', company: 'Apple Inc.', price: 189.25, change: 1.45, volume: 52341200, marketCap: '2.94T' },
  // ... more rows
];

const hot = new Handsontable(document.querySelector('#example1'), {
  data: stockData,
  colHeaders: ['Symbol', 'Company', 'Price ($)', 'Change ($)', 'Volume', 'Market Cap'],
  columns: [
    { data: 'symbol', readOnly: true },
    { data: 'company', readOnly: true, width: 180 },
    { data: 'price', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
    { data: 'change', type: 'numeric', numericFormat: { pattern: '0,0.00' } },
    { data: 'volume', type: 'numeric', numericFormat: { pattern: '0,0' } },
    { data: 'marketCap', readOnly: true },
  ],
  rowHeaders: true,
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:**

- Symbol, Company, and Market Cap are marked `readOnly: true` -- the feed never updates them.
- Price and Change use `type: 'numeric'` with number formatting so values render as `189.25` rather than a raw float.
- The `data` option points to an array of plain objects (`stockData`). Handsontable holds a reference to this array, so changing the array directly would bypass the rendering pipeline -- always use `setDataAtRowProp` or `setDataAtCell` instead.

## Step 2: Flash cells when data arrives

Register an `afterChange` hook before starting the feed. The hook receives every change together with the `source` string that identifies who made the change.

```javascript
hot.addHook('afterChange', (changes, source) => {
  if (source !== 'external' || !changes) {
    return;
  }

  changes.forEach(([row]) => {
    [2, 3].forEach((col) => {
      const td = hot.getCell(row, col);

      if (td) {
        td.classList.remove('ht-cell-flash');
        void td.offsetWidth; // Force reflow to restart the animation.
        td.classList.add('ht-cell-flash');
        td.addEventListener('animationend', () => td.classList.remove('ht-cell-flash'), { once: true });
      }
    });
  });
});
```

**What's happening:**

- The guard `source !== 'external'` skips all changes that the user makes themselves. Without this guard, every keystroke in a cell would also trigger the flash animation.
- `hot.getCell(row, col)` returns the live `<td>` DOM element. It returns `null` when the row is outside the current viewport (virtual rendering), so the `if (td)` check is required.
- Removing the class, forcing a reflow (`void td.offsetWidth`), and then re-adding it restarts the CSS animation even if the cell was already flashing from a previous update.
- The `{ once: true }` event listener option automatically removes the listener after the animation ends, preventing memory leaks when cells update repeatedly.

**Why use `afterChange` instead of updating the DOM directly?**

The hook fires after Handsontable has already rendered the new value to the DOM. Reading `td` from the hook is safe because the cell is guaranteed to be up to date at that point.

## Step 3: Add the flash CSS animation

Create a CSS file with a `@keyframes` rule that fades a yellow background to transparent.

```css
@keyframes cellFlash {
  0%   { background-color: rgba(255, 220, 0, 0.75); }
  100% { background-color: transparent; }
}

.ht-cell-flash {
  animation: cellFlash 0.8s ease-out;
}
```

**What's happening:**

- The animation starts at a semi-transparent yellow (`rgba(255, 220, 0, 0.75)`) and eases to transparent over 0.8 seconds.
- `ease-out` means the flash fades faster at the start and slows toward the end, which feels natural for a "data just arrived" signal.
- The class name `ht-cell-flash` is scoped narrowly -- it does not conflict with any built-in Handsontable CSS.

## Step 4: Simulate the WebSocket feed with setInterval

In a production app you would open a real WebSocket. For this recipe, a `setInterval` sends a random update every 1.5 seconds. The simulation is clearly a stand-in -- replace the `setInterval` block with a WebSocket when you connect to a real feed.

```javascript
// Simulation -- replace with a real WebSocket in production:
//   const ws = new WebSocket('wss://your-feed.example.com');
//   ws.onmessage = (event) => { const msg = JSON.parse(event.data); applyUpdate(msg); };
const intervalId = setInterval(() => {
  const row = Math.floor(Math.random() * stockData.length);
  const basePrice = stockData[row].price;
  const newPrice = parseFloat((basePrice + (Math.random() - 0.5) * 4).toFixed(2));
  const newChange = parseFloat((newPrice - basePrice + stockData[row].change).toFixed(2));

  hot.setDataAtRowProp(row, 'price', newPrice, 'external');
  hot.setDataAtRowProp(row, 'change', newChange, 'external');
}, 1500);
```

**What's happening:**

- A random row index is picked on each tick.
- A new price is calculated by adding a small random delta (between -2 and +2) to the current price.
- `hot.setDataAtRowProp(row, 'price', newPrice, 'external')` updates the cell at `row` in the `price` column.

**Why `setDataAtRowProp` instead of `loadData`?**

`loadData` replaces the entire data set and triggers a full re-render of every cell. For streaming data with dozens of updates per second, a full re-render on every tick would degrade performance noticeably and would reset the scroll position. `setDataAtRowProp` (and its sibling `setDataAtCell`) renders only the affected cell, leaving everything else untouched.

**Why pass `'external'` as the fourth argument?**

Handsontable propagates the source string to every hook that fires as a result of the change -- including `afterChange`, `beforeChange`, and the undo/redo stack. Tagging programmatic updates as `'external'` lets you:

- Skip the flash animation for user edits (the guard in Step 2).
- Exclude feed updates from the undo history (you can filter the source in `beforeChange` if needed).
- Identify the origin of a change when logging or debugging.

## Step 5: Clean up on page unload

Always release resources when the user navigates away. For a `setInterval`, call `clearInterval`. For a real WebSocket, call `ws.close()`.

```javascript
window.addEventListener('beforeunload', () => {
  clearInterval(intervalId);
  // ws.close(); // Uncomment when using a real WebSocket.
});
```

**What's happening:**

- The `beforeunload` event fires just before the browser unloads the page.
- `clearInterval` stops the simulation so no further updates are attempted after the page is gone.
- Without this cleanup, the interval callback could attempt to call `hot.setDataAtRowProp` on a destroyed Handsontable instance.

## How It Works - Complete Flow

1. **Page loads** - Handsontable renders the initial stock data.
2. **`afterChange` hook registered** - any future change tagged `'external'` will trigger the flash.
3. **`setInterval` starts** - every 1.5 seconds a random row is selected.
4. **`setDataAtRowProp` called** - Handsontable updates the cell value and re-renders only that cell.
5. **`afterChange` fires with source `'external'`** - the hook locates the `<td>` element and adds `ht-cell-flash`.
6. **CSS animation plays** - the cell flashes yellow and fades to transparent over 0.8 seconds.
7. **`animationend` fires** - the `ht-cell-flash` class is removed, ready for the next update.
8. **User navigates away** - `beforeunload` clears the interval, preventing stale callbacks.

## What you learned

- Use `setDataAtCell` or `setDataAtRowProp` to update individual cells without a full re-render.
- Pass a custom source string (`'external'`) to distinguish programmatic updates from user edits in `afterChange` and other hooks.
- Retrieve a live `<td>` element with `hot.getCell(row, col)` and apply a CSS animation class to highlight the change.
- Clean up intervals and WebSocket connections in a `beforeunload` listener.

## Next steps

- Connect to a real WebSocket by replacing `setInterval` with `new WebSocket(url)` and parsing JSON messages in `ws.onmessage`.
- Add a `beforeChange` hook to discard stale feed updates if the user has started editing the same cell.
- Use the [`afterChange`](@/api/hooks.md#afterchange) hook to log all external updates to a separate audit trail.
- Combine this technique with [Conditional cell formatting](@/guides/cell-features/conditional-formatting/conditional-formatting.md) to color cells red or green based on whether the price rose or fell.

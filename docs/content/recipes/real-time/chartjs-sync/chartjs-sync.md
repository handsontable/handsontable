---
id: a3f7b2c9
title: Sync rows to a Chart.js chart
metaTitle: Sync selected rows to a Chart.js chart - JavaScript Data Grid | Handsontable
description: Learn how to sync selected rows from a Handsontable grid to a Chart.js bar chart in real time using the afterSelectionEnd hook.
permalink: /recipes/real-time/chartjs-sync
canonicalUrl: /recipes/real-time/chartjs-sync
tags:
  - recipes
  - tutorial
  - chart.js
  - selection
  - real-time
react:
  id: b5e8d1f4
  metaTitle: Sync selected rows to a Chart.js chart - React Data Grid | Handsontable
angular:
  id: c6f9e2a5
  metaTitle: Sync selected rows to a Chart.js chart - Angular Data Grid | Handsontable
vue:
  id: w5h61ok1
  metaTitle: Sync selected rows to a Chart.js chart - Vue Data Grid | Handsontable
searchCategory: Recipes
category: Real-time and Integrations
type: how-to
---

In this tutorial, you will sync selected rows from a Handsontable grid to a Chart.js bar chart in real time. You will learn how to use `afterSelectionEnd` and `afterDeselect` hooks to read the current selection and update the chart without destroying and recreating it.

::: only-for javascript vue

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3 --html 4 --deps chart.js

@[code](@/content/recipes/real-time/chartjs-sync/javascript/example1.js)
@[code](@/content/recipes/real-time/chartjs-sync/javascript/example1.ts)
@[code](@/content/recipes/real-time/chartjs-sync/javascript/example1.css)
@[code](@/content/recipes/real-time/chartjs-sync/javascript/example1.html)

:::

:::

::: only-for react

::: example #example1 :react-advanced --css 1 --js 2 --ts 3 --deps chart.js

@[code](@/content/recipes/real-time/chartjs-sync/react/example1.css)
@[code](@/content/recipes/real-time/chartjs-sync/react/example1.jsx)
@[code](@/content/recipes/real-time/chartjs-sync/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2 --deps chart.js

@[code](@/content/recipes/real-time/chartjs-sync/angular/example1.ts)
@[code](@/content/recipes/real-time/chartjs-sync/angular/example1.html)

:::

:::

## Overview

**Difficulty:** Beginner
**Time:** ~15 minutes
**Libraries:** `chart.js`

This recipe shows how to connect a Handsontable grid to a [Chart.js](https://www.chartjs.org/) bar chart. When the user selects rows in the grid, the chart below updates immediately to show the corresponding data. No page reload or button click is required.

## What You'll Build

A grid showing marketing campaign data with two numeric columns per campaign (Q1 Revenue and Q2 Revenue). Selecting one or more rows in the grid updates a bar chart below the grid to compare the revenue figures for those campaigns. Deselecting all rows returns the chart to a placeholder state.

## Before You Begin

Install Chart.js in your project:

```bash
npm install chart.js
```

If you want to run the example without a build step, include Chart.js from a CDN instead:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

## Step 1: Import Dependencies

```javascript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { Chart, registerables } from 'chart.js';

registerAllModules();
Chart.register(...registerables);
```

`registerAllModules()` activates all Handsontable plugins and cell types. `Chart.register(...registerables)` registers all Chart.js components -- scales, controllers, and elements -- needed to render bar charts.

## Step 2: Prepare the Data

```javascript
const data = [
  { campaign: 'Spring Sale 2025', q1Budget: 12000, q1Revenue: 34500, q2Budget: 15000, q2Revenue: 41200 },
  { campaign: 'Brand Awareness Q1', q1Budget: 8000, q1Revenue: 11300, q2Budget: 9500, q2Revenue: 13800 },
  // ... more rows
];
```

The dataset uses an analytics domain: each row is a marketing campaign with budget and revenue figures for Q1 and Q2. The chart will display Q1 and Q2 revenue for selected rows.

## Step 3: Create the Chart Instance

```javascript
const canvas = document.querySelector('#chart-canvas');

const chart = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: ['Select rows above to compare campaigns'],
    datasets: [
      {
        label: 'Q1 Revenue ($)',
        data: [0],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Q2 Revenue ($)',
        data: [0],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
  },
});
```

Create the Chart.js instance once -- before initializing Handsontable. The initial state uses a placeholder label and zero values. You will update these values later using `chart.update()` instead of destroying and recreating the chart on every selection change. This avoids expensive DOM teardown and prevents flickering.

## Step 4: Write the `updateChart` Function

```javascript
function updateChart(hot) {
  const selected = hot.getSelected();

  if (!selected || selected.length === 0) {
    chart.data.labels = ['Select rows above to compare campaigns'];
    chart.data.datasets[0].data = [0];
    chart.data.datasets[1].data = [0];
    chart.update();
    return;
  }

  const rowSet = new Set();

  for (const [r1, , r2] of selected) {
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);

    for (let row = minRow; row <= maxRow; row++) {
      rowSet.add(row);
    }
  }

  const rows = [...rowSet].sort((a, b) => a - b);
  const labels = [];
  const q1Values = [];
  const q2Values = [];

  for (const row of rows) {
    const rowData = hot.getDataAtRow(row);

    labels.push(rowData[0]);
    q1Values.push(rowData[2]);
    q2Values.push(rowData[4]);
  }

  chart.data.labels = labels;
  chart.data.datasets[0].data = q1Values;
  chart.data.datasets[1].data = q2Values;
  chart.update();
}
```

`hot.getSelected()` returns an array of `[startRow, startCol, endRow, endCol]` tuples -- one entry per selection range. With `selectionMode: 'range'`, the logic handles arbitrary ranges correctly by extracting unique row indices.

The function uses a `Set` to collect unique row indices. This prevents duplicates when selection ranges overlap. Rows are then sorted so the chart bars appear in the same top-to-bottom order as the grid.

`hot.getDataAtRow(row)` returns the current rendered row data as an array. Column indexes 0, 2, and 4 correspond to Campaign name, Q1 Revenue, and Q2 Revenue respectively.

Assigning new arrays to `chart.data.labels` and `chart.data.datasets[i].data` then calling `chart.update()` is the recommended Chart.js pattern for in-place updates. It avoids the cost of destroying and recreating the chart instance.

## Step 5: Initialize Handsontable with `selectionMode: 'range'`

```javascript
const hot = new Handsontable(container, {
  data,
  colHeaders: ['Campaign', 'Q1 Budget ($)', 'Q1 Revenue ($)', 'Q2 Budget ($)', 'Q2 Revenue ($)'],
  columns: [
    { data: 'campaign', type: 'text', width: 200 },
    { data: 'q1Budget', type: 'numeric', numericFormat: { pattern: '$0,0' }, width: 120 },
    { data: 'q1Revenue', type: 'numeric', numericFormat: { pattern: '$0,0' }, width: 120 },
    { data: 'q2Budget', type: 'numeric', numericFormat: { pattern: '$0,0' }, width: 120 },
    { data: 'q2Revenue', type: 'numeric', numericFormat: { pattern: '$0,0' }, width: 120 },
  ],
  rowHeaders: true,
  selectionMode: 'range',
  afterSelectionEnd() {
    updateChart(this);
  },
  afterDeselect() {
    updateChart(this);
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

`selectionMode: 'range'` allows selecting a contiguous range of cells. Click any cell in a row to include that row in the chart. Drag to select multiple rows at once.

Two hooks drive the chart updates:

- `afterSelectionEnd` -- fires when the user finishes a selection. The `this` context inside the hook is the Handsontable instance, so passing `this` to `updateChart` provides direct access to the grid's data and selection state.
- `afterDeselect` -- fires when all cells are deselected (e.g., pressing `Escape`). Without this hook, the chart would retain the last selection's bars after the user clears the selection.

## How It Works - Complete Flow

1. **Grid renders** with 8 campaign rows. The chart shows a placeholder label.
2. **User clicks a row** -- `afterSelectionEnd` fires. `hot.getSelected()` returns one range tuple. `updateChart` reads that row's campaign name and revenue values, then calls `chart.update()`. The chart now shows one group of two bars.
3. **User drags across another row** -- `afterSelectionEnd` fires again. `hot.getSelected()` returns the range tuple. The `Set` deduplicates rows. The chart now shows two groups of bars.
4. **User presses Escape** -- `afterDeselect` fires. `hot.getSelected()` returns `undefined`. `updateChart` resets the chart to the placeholder state.

## What you learned

- How to use `afterSelectionEnd` and `afterDeselect` hooks to react to grid selection changes.
- How to read multi-range selections with `hot.getSelected()` and collect unique row indices.
- How to use `hot.getDataAtRow()` to read current cell values.
- How to update a Chart.js chart in place with `chart.data.labels`, `chart.data.datasets[i].data`, and `chart.update()` -- without destroying and recreating the chart instance.
- How `selectionMode: 'range'` enables range selection for comparison workflows.

## Next steps

- Extend the chart to include more numeric columns (e.g., add Q1 Budget and Q2 Budget as additional datasets).
- Add a column filter so the chart only reflects visible rows.
- Replace the bar chart with a radar or line chart to show trends across more dimensions.
- Persist the selected row indices to a URL parameter so users can share a specific comparison view.

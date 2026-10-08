---
type: tutorial
title: Add AI-classified columns with Jev
metaTitle: Add AI-classified columns with Jev - JavaScript Data Grid | Handsontable
description: Send each row to Jev, TypeSafe AI's decision model, and fill new columns with typed answers and calibrated confidence as the results arrive.
permalink: /recipes/real-time/ai-columns-jev
canonicalUrl: /recipes/real-time/ai-columns-jev
tags:
  - ai
  - jev
  - typesafe
  - classification
  - confidence
  - tutorial
  - recipes
searchCategory: Recipes
category: Real-time & Integrations
menuTag: new
---

In this tutorial, you will add three AI-generated columns to a grid of product reviews with one click: a sentiment level, an issue category, and the probability that the review needs a reply. You will learn how to define the columns in code, send one request per row to a decision model, write each answer into the grid as it lands, and show the model's confidence next to every value.

![The finished example: ten product reviews with Sentiment, Category, and Needs reply columns filled in, and confidence cells shaded by band](/img/pages/ai-columns-jev/finished-example.png)

::: only-for javascript

::: example #example1 :hot-recipe --js 1 --ts 2 --css 3

@[code](@/content/recipes/real-time/ai-columns-jev/javascript/example1.js)
@[code](@/content/recipes/real-time/ai-columns-jev/javascript/example1.ts)
@[code](@/content/recipes/real-time/ai-columns-jev/javascript/example1.css)

:::

:::

## Overview

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Stack:** Handsontable, [Jev](https://docs.typesafe.ai) by TypeSafe AI through a small proxy you host

Jev is a decision model, not a chat model. It answers typed questions. A **Noul** is yes or no, a **Score** is a position on ordered levels, and a **Choice** is one option from a list. Score and Choice answers carry a confidence, a probability you can sort, filter, and set thresholds on. There is no free text to parse, so an answer can go straight into a cell.

The example on this page uses a stand-in for the model: Jev's recorded answers for these ten reviews, returned after a short delay. The page makes no network request and needs no API key. [Step 5](#step-5-plug-in-the-real-model) shows where the real model plugs in.

## What you'll build

- A grid of ten product reviews with a **Classify reviews** button above it.
- Three AI columns defined as data. Score and Choice columns get a confidence column next to them.
- A click sequence that adds the columns, marks every cell pending, sends requests a few at a time, and writes results by physical row so sorting mid-fill cannot misplace them.
- Renderers that shade confidence (red below 60%, green above 85%) and show `err` on a failed row without stopping the rest.

## Before you begin

- A working Handsontable installation. See the [installation](@/guides/getting-started/installation/installation.md) guide.
- For Step 5 only: a Jev API key from [console.typesafe.ai](https://console.typesafe.ai) and a place to run a server-side proxy. Jev is in early access, so a key can take time to get. Steps 1 to 4 need neither.

## Step 1: Set up the grid

The example injects a controls row and a grid mount point into `#example1`, then creates the grid from an array of review objects. The three source columns are read-only, and the review column has a fixed width so long text wraps.

```ts
const columns: ColumnSettings[] = [
  { data: 'id', readOnly: true, width: 50, className: 'htRight' },
  { data: 'product', readOnly: true, width: 140 },
  { data: 'review', readOnly: true, width: 380 },
];
const headers = ['ID', 'Product', 'Review'];

const hot = new Handsontable(gridContainer, {
  data: reviews,
  columns,
  colHeaders: headers,
  columnSorting: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

**What's happening:** `columns` and `headers` are module-level arrays. Step 3 appends to them and calls `updateSettings()` with copies, which is how the AI columns appear without rebuilding the grid. Sorting stays on so you can test that a sort applied mid-fill does not scramble the results.

## Step 2: Define the AI columns

Each column is a plain object: a `key` for the data property, a `name` for the header, a Jev question `type`, the `prompt`, and, for Score and Choice, the `options`.

```ts
const AI_COLUMNS: AiColumn[] = [
  {
    key: 'sentiment',
    name: 'Sentiment',
    type: 'score',
    prompt: 'How positive is this review overall?',
    options: ['Very negative', 'Negative', 'Mixed', 'Positive', 'Very positive'],
  },
  {
    key: 'category',
    name: 'Category',
    type: 'choice',
    prompt: 'Which category best fits the main issue in this review?',
    options: ['quality', 'shipping', 'price', 'support', 'usability'],
  },
  {
    key: 'needsReply',
    name: 'Needs reply',
    type: 'noul',
    prompt: 'Does this review warrant a reply from customer support?',
  },
];
```

**What's happening:** each type maps to a Jev answer shape, and `toCells()` picks the fields a cell shows.

| Type | `options` | Jev answers with | Shown in the grid |
|---|---|---|---|
| `noul` | none | `noul`: the probability of "yes", 0 to 1 | that number |
| `score` | 2 to 10 ordered levels, low to high | `score`, `probabilities` per level, `confidence` | the level with the highest probability, and the confidence |
| `choice` | 2 or more options | `choice`, `probabilities`, `confidence` | the option, and the confidence |

The grid never talks to Jev directly. It calls `classify(row, column)`, which resolves with Jev's answer object for that row. In the example that function looks up a recorded answer and resolves after 150 to 400 ms:

```ts
function classify(row: Row, column: AiColumn): Promise<JevAnswer> {
  const answer = RECORDED[`${column.key}:${row.id}`];

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (answer) {
        resolve(answer);
      } else {
        reject(new Error('No answer'));
      }
    }, 150 + Math.random() * 250);
  });
}
```

`toCells()` reads the answer. A Noul is one number, so it becomes the cell value as-is. For a Score, the level with the highest entry in `probabilities` is the value, and `confidence` goes to the confidence column. For a Choice, `choice` and `confidence` map the same way.

```ts
function toCells(column: AiColumn, answer: JevAnswer): { value: string | number; confidence?: number } {
  switch (answer.type) {
    case 'noul':
      return { value: answer.noul };
    case 'score': {
      const [best] = Object.entries(answer.probabilities).sort(([, a], [, b]) => b - a)[0];

      return { value: column.options?.[Number(best)] ?? String(answer.score), confidence: answer.confidence };
    }
    case 'choice':
      return { value: answer.choice, confidence: answer.confidence };
    default:
      return { value: '' };
  }
}
```

## Step 3: Classify on click

The button handler adds a value column per definition, a confidence column where Jev returns one, marks every new cell as pending, and then runs one request per cell through a small pool.

```ts
button.addEventListener('click', async () => {
  button.disabled = true;

  AI_COLUMNS.forEach((column) => {
    columns.push({ data: column.key, readOnly: true, renderer: valueRenderer(column), width: 130 });
    headers.push(column.name);

    if (column.type !== 'noul') {
      columns.push({
        data: `${column.key}Confidence`,
        readOnly: true,
        renderer: confidenceRenderer(column),
        width: 125,
        className: 'htRight',
      });
      headers.push(`${column.name} conf.`);
    }

    reviews.forEach((row) => pending.add(`${column.key}:${row.id}`));
  });
  hot.updateSettings({ columns: [...columns], colHeaders: [...headers] });

  const jobs = AI_COLUMNS.flatMap((column) => reviews.map((row) => ({ column, row })));

  await runPool(jobs, 4, async ({ column, row }) => {
    const key = `${column.key}:${row.id}`;
    const physicalRow = reviews.indexOf(row);

    try {
      const cells = toCells(column, await classify(row, column));

      hot.setSourceDataAtCell(physicalRow, column.key, cells.value);

      if (cells.confidence !== undefined) {
        hot.setSourceDataAtCell(physicalRow, `${column.key}Confidence`, cells.confidence);
      }
    } catch (error) {
      failed.set(key, error instanceof Error ? error.message : 'Request failed');
    } finally {
      pending.delete(key);
      hot.render();
    }
  });
});
```

**What's happening:** `setSourceDataAtCell()` takes a physical row index, so a result lands on the row it was computed for even if the user sorts the grid while requests are in flight. `runPool()` keeps four requests in flight at once. Jev allows far more, but a limit keeps the cascade readable and protects the proxy. A failed row records its error and the loop moves on.

## Step 4: Show pending state and confidence

Two renderer factories close over the column definition. Both call `textRenderer()` first and then toggle CSS classes based on the cell's state.

```ts
const valueRenderer = (column: AiColumn): BaseRenderer => (instance, td, row, col, prop, value, cellProperties) => {
  const text = typeof value === 'number' ? value.toFixed(2) : value ?? '';

  textRenderer(instance, td, row, col, prop, text, cellProperties);

  const key = cellKey(instance, row, column);

  td.classList.toggle('ai-pending', pending.has(key));
  td.classList.toggle('ai-error', failed.has(key));
};

const confidenceRenderer = (column: AiColumn): BaseRenderer => (instance, td, row, col, prop, value, cellProperties) => {
  const text = typeof value === 'number' ? `${Math.round(value * 100)}%` : '';

  textRenderer(instance, td, row, col, prop, text, cellProperties);

  const key = cellKey(instance, row, column);

  td.classList.toggle('ai-pending', pending.has(key));
  td.classList.toggle('ai-low', typeof value === 'number' && value < 0.6);
  td.classList.toggle('ai-high', typeof value === 'number' && value > 0.85);
};
```

**What's happening:** `cellKey()` maps the renderer's visual row back to the review through `toPhysicalRow()` and `getSourceDataAtRow()`, so the pending and error state follows the row under sorting. `classList.toggle(name, force)` adds or removes each class on every render, which matters because Handsontable reuses `<td>` elements as you scroll. The shimmer, error, and band colors live in `example1.css`.

Look at the mixed reviews. "Great desk but shipping took 3 weeks" scores `Mixed` with 96% confidence: the model is sure the review is mixed. "The keys arrived dead, support fixed it fast, I'm happy now" gets 0.65 on "needs reply", a lean toward yes rather than a verdict.

## Step 5: Plug in the real model

Replace the body of `classify()` with a request to a proxy that holds your key. The row goes to the proxy as-is; the proxy forwards it to Jev and returns Jev's answer.

```ts
function classify(row: Row, column: AiColumn): Promise<JevAnswer> {
  return fetch('/api/classify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: column.type, prompt: column.prompt, options: column.options, row }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  });
}
```

The proxy below is a Cloudflare Worker. It checks the request shape, caps the row at 4 KB, builds the Jev question, and returns Jev's answer unchanged. It does not log the row and does not forward Jev's error bodies.

::: example #worker --code-only

@[code js](@/content/recipes/real-time/ai-columns-jev/javascript/worker.js)

:::

**What's happening:** Jev's API is one endpoint, `POST https://api.typesafe.ai/v1/systemone`, with a Bearer key and a body of `{ model, state, questions }`. The row object is the `state`. A Noul answer has one field, `noul`, the probability of yes. A Score answer has `score`, a position between the levels, plus `probabilities` per level, a `legend`, and `confidence`. A Choice answer has `choice`, `probabilities`, and `confidence`. The [Jev API reference](https://docs.typesafe.ai/api) has the full shapes.

Three limits to keep in mind:

- One request per cell. Ten rows and three columns is 30 requests. Cap the row count in the proxy before you point this at a large sheet. Jev's published limit is 80 requests per second.
- Send only what the model needs. The example sends the whole row, which is fine for reviews. For a sheet with personal or confidential columns, send the columns the prompt is about.
- Thresholds are yours to set. Pick them per column from your own data, and send low-confidence rows to a person instead of acting on them.

## What you learned

- How to describe AI columns as data and add them to a grid with `updateSettings()`.
- How Jev's Noul, Score, and Choice answers map to cells.
- How to write asynchronous results by physical row with `setSourceDataAtCell()` so sorting cannot misplace them.
- How renderers can reflect per-cell state such as pending and failed, and shade a confidence band.
- Where an API key belongs: in a proxy, never in the page.

## Next steps

- [Agent-driven grid with A2UI](@/recipes/real-time/a2ui-agent-grid/a2ui-agent-grid.md): an agent describes the grid itself.
- [Real-time cell updates via WebSocket](@/recipes/real-time/websocket-updates/websocket-updates.md): the same `setDataAtRowProp()` pattern for streaming data.
- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md): everything a custom renderer can do.

## Related

- [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell)
- [`updateSettings()`](@/api/core.md#updatesettings)
- [`columnSorting`](@/api/options.md#columnsorting)

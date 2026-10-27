---
type: tutorial
title: Agent-driven grid with CopilotKit
metaTitle: Agent-driven grid with CopilotKit | Handsontable DataGrid for JavaScript
description: Let an AI agent edit a Handsontable DataGrid through CopilotKit tools. The agent writes columns, data, and formulas; HyperFormula computes them in the browser; and one undo stack covers both agent and user edits.
permalink: /recipes/real-time/copilotkit-agent-grid
canonicalUrl: /recipes/real-time/copilotkit-agent-grid
framework: react
menuTag: new
tags:
  - copilotkit
  - generative-ui
  - agent
  - ai
  - hyperformula
  - formulas
  - tutorial
  - recipes
react:
  metaTitle: Agent-driven grid with CopilotKit | Handsontable DataGrid for React
searchCategory: Recipes
category: Real-time & Integrations
---

In this tutorial, you will let an AI agent edit a Handsontable DataGrid through [CopilotKit](https://copilotkit.ai/) tools. You keep an ordinary grid that your app owns. The agent calls functions you register to write columns, data, and `=` formulas; HyperFormula computes the numbers in the browser; and one undo stack covers both the agent's edits and the user's.

<iframe src="https://demos.handsontable.com/embed/346n1c5q61/"
  style="width:100%; height: 760px; border:0; border-radius: 4px; overflow:hidden;"
  title="An agent builds and edits a budget grid through CopilotKit tools"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in the demo runner**](https://demos.handsontable.com/share/346n1c5q61)

The grid above is a normal Handsontable instance. An agent builds the sheet, then edits one cell: it calls `createSpreadsheet`, then `setCells`. Below the grid, the panel titled **"Agent tool calls"** logs each call as it runs, and **"What the agent sees"** shows the read-only snapshot the agent reads before acting. Edit a cell yourself, then press **Agent: undo** -- the same undo stack reverts your edit and the agent's alike. Every `=` cell is computed by HyperFormula; the agent writes the formula, never the number.

**Note:** in this demo the agent's calls come from a fixed script that stands in for the model, so there is no backend and no API key. The last section shows where a real agent plugs in.

<script>
  // Keep the embedded demo in the same light/dark mode as this page. The
  // demos.handsontable.com embed wrapper posts { source, ready } when it loads
  // and applies any { source, mode } it receives.
  (() => {
    const SOURCE = 'hot-runner-scheme';
    const ORIGIN = 'https://demos.handsontable.com';
    const mode = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    const frames = () => Array.from(document.querySelectorAll('iframe[src^="' + ORIGIN + '"]'));
    const send = (win) => win && win.postMessage({ source: SOURCE, mode: mode() }, ORIGIN);
    window.addEventListener('message', (event) => {
      if (event.origin === ORIGIN && event.data && event.data.source === SOURCE && event.data.ready) send(event.source);
    });
    new MutationObserver(() => frames().forEach((frame) => send(frame.contentWindow))).observe(
      document.documentElement,
      { attributes: true, attributeFilter: ['data-theme'] },
    );
  })();
</script>

## Overview

CopilotKit connects an agent to a React app through two hooks. `useFrontendTool` registers a function the agent can call, with a Zod schema for its arguments. `useAgentContext` hands the agent a read-only view of your state, so it knows what it is editing. The agent runs in CopilotKit's chat; your code decides what it can read and what it can do.

That makes the grid the opposite of a controlled component. Handsontable owns the data. The agent writes through the live instance, and your React state keeps only a read-only snapshot for the agent to read. Because every change -- the agent's and the user's -- goes through the one instance, Handsontable's own undo covers both.

The agent writes columns, rows, and `=` formulas. The grid computes the numbers. The agent never does arithmetic.

> This recipe is the tool-calling counterpart to the [agent-driven grid with A2UI](@/recipes/real-time/a2ui-agent-grid/a2ui-agent-grid.md). There, the agent *describes* the grid in a declarative protocol and the client renders it. Here, the agent *calls functions* against a grid your app already owns. The payoff of this approach is agent-driven undo: a tool can undo across both the agent's and the user's edits.

**Difficulty:** Intermediate
**Time:** ~25 minutes
**Stack:** React, CopilotKit 1.79 (v2 API), Handsontable, HyperFormula

## What you'll build

- An instance-owned grid component that Handsontable renders and HyperFormula computes.
- A set of grid operations with no knowledge of the agent, so one code path serves both the agent's tools and any script or button you write.
- A read-only snapshot of the sheet, exposed to the agent with `useAgentContext`.
- Three agent tools -- `createSpreadsheet`, `setCells`, and `undo` -- registered with `useFrontendTool`.
- A CopilotKit chat that drives all three.

## Before you begin

This recipe assumes a React app. Install the dependencies:

```shell
npm install handsontable @handsontable/react-wrapper hyperformula @copilotkit/react-core zod
```

CopilotKit's v2 API lives under the `@copilotkit/react-core/v2` entry point. This recipe is written against `@copilotkit/react-core` 1.79. The provider, the chat component, `useFrontendTool`, and `useAgentContext` all import from that entry, and its stylesheet is `@copilotkit/react-core/v2/styles.css`.

Handsontable touches `window`, so render the grid on the client only. In the Next.js App Router, mark the file `'use client'`; with a framework that renders on the server, load the grid through a client-only dynamic import.

## Step 1: The instance-owned grid

::: example #grid-tsx --code-only

@[code tsx](@/content/recipes/real-time/copilotkit-agent-grid/react/Grid.tsx)

:::

**What's happening:** the grid takes its data once, through `initialData`, and never again. After mount, every change goes through the live instance, which the parent reaches with `hotRef`. `formulas: { engine: HyperFormula }` turns every cell that starts with `=` into a live formula. `afterChange` and the create and remove hooks call `onMutate`, so the parent can refresh its snapshot after any change, including one the user makes by hand.

`Grid` is wrapped in `React.memo`, and this is load-bearing. `@handsontable/react-wrapper` re-applies the `data` prop through `updateSettings` on every render, which would overwrite the instance-owned data and reset the undo stack. Keeping the component from re-rendering is how the grid gets to own its data while you still use the official React wrapper, so pass it only referentially stable props: a `useRef` for the initial data, and `useCallback` handlers.

Sorting, filtering, and row or column moving stay off. Those plugins work on visual indexes and rewrite the in-grid aggregate formulas -- a sort turns a totals row's `=SUM(D1:D3)` into `=SUM(#REF!)`, and a manual row move silently mangles the range. See [Known limitations](#known-limitations).

## Step 2: Grid operations the agent and your app share

::: example #operations-ts --code-only

@[code ts](@/content/recipes/real-time/copilotkit-agent-grid/react/operations.ts)

:::

**What's happening:** these functions take a Handsontable instance and change it. They know nothing about CopilotKit, so the demo's script and the agent's tools call the same code. Three details carry the pattern:

- **`setDataAtCell`, not `setSourceDataAtCell`.** The source-data path skips the edit pipeline, so HyperFormula would not recompute and the change would not enter the undo stack. `setDataAtCell` takes visual coordinates, so each physical coordinate the agent sends is translated with `toVisualRow` and `toVisualColumn`.
- **`alter` actions are directional.** The valid actions are `insert_row_above`, `insert_row_below`, `insert_col_start`, `insert_col_end`, `remove_row`, and `remove_col`. There is no bare `insert_row`.
- **`undo` lives on the plugin.** Call `hot.getPlugin('undoRedo').undo()`. There is no `hot.undo()` on the typed core.

A model sometimes wraps a value in an object even when the schema asks for a string or a number, so `toCell` coerces anything to a primitive before it reaches a cell.

## Step 3: Expose the sheet to the agent

Hold a read-only snapshot in React state and refresh it on every change. `useAgentContext` hands that snapshot to the agent, with a description of what it is and how to address it:

```tsx
const [mirror, setMirror] = useState<{ columns: string[]; data: Cell[][] }>({ columns: [], data: [] });

const getHot = useCallback(() => hotRef.current?.hotInstance ?? null, []);

const snapshot = useCallback(() => {
  const hot = getHot();
  if (!hot) return;
  setMirror({
    columns: (hot.getColHeader() as (string | number)[]).map(String),
    data: structuredClone(hot.getSourceData()) as Cell[][],
  });
}, [getHot]);

const context = useMemo(
  () => ({
    description:
      "The spreadsheet the user sees. 'columns' are the headers, 'data' is the rows; a cell " +
      "starting with '=' is a live formula. Tools take 0-based row and col indices into the data " +
      '(first data row = 0). Formulas use A1 style, where the first data row is row 1. Write ' +
      'formulas as strings that start with =, and never compute the numbers yourself.',
    value: mirror,
  }),
  [mirror],
);
useAgentContext(context);
```

**What's happening:** the snapshot reads `getSourceData`, so the agent sees the formulas the cells hold, not only the computed values. Pass `useAgentContext` a memoized value object. A fresh object literal on every render would make its effect run in a loop. Because `snapshot` runs on every change, the agent's view stays current after a user edit as well as an agent edit.

## Step 4: Give the agent tools

Each tool pairs a Zod schema with a handler that calls one of the operations from Step 2, then refreshes the snapshot:

```tsx
useFrontendTool({
  name: 'createSpreadsheet',
  description: 'Create or replace the whole sheet in one call, formulas included. Replacing the sheet clears the undo history.',
  parameters: z.object({
    columns: z.array(z.string()).describe('Column header labels'),
    rows: z.array(z.array(z.union([z.string(), z.number()]))).describe(
      "Rows aligned to columns; put '='-prefixed formula strings wherever a value is computed",
    ),
  }),
  handler: async ({ columns, rows }) => {
    const hot = getHot();
    if (!hot) return 'The grid is not ready yet';
    createSpreadsheet(hot, columns, rows);
    snapshot();
    return `Built a ${columns.length}-column sheet`;
  },
}, [getHot, snapshot]);

useFrontendTool({
  name: 'setCells',
  description: "Set one or more cells. A value may be a number, text, or a '='-prefixed formula.",
  parameters: z.object({
    cells: z.array(
      z.object({ row: z.number(), col: z.number(), value: z.union([z.string(), z.number()]) }),
    ),
  }),
  handler: async ({ cells }) => {
    const hot = getHot();
    if (!hot) return 'The grid is not ready yet';
    setCells(hot, cells);
    snapshot();
    return `Updated ${cells.length} cell(s)`;
  },
}, [getHot, snapshot]);

useFrontendTool({
  name: 'undo',
  description: 'Undo the last change. It spans both agent and user edits.',
  parameters: z.object({}),
  handler: async () => {
    const hot = getHot();
    if (!hot) return 'The grid is not ready yet';
    const reverted = undo(hot);
    snapshot();
    return reverted ? 'Undid the last change' : 'Nothing to undo';
  },
}, [getHot, snapshot]);
```

**What's happening:** the handler returns a short string, which the agent reads as the result of its call. The schema is the contract the model fills, so its field descriptions double as instructions.

Keep each handler idempotent, so a repeated call does no harm. `createSpreadsheet` and `setCells` write the same result twice over; `undo` does not, because a second call reverts a second step. If your setup ever dispatches a tool call more than once, guard `undo` -- ignore a repeat that arrives within a second of the previous one, or dedupe by the tool-call id.

## Step 5: Wire it together

The canvas holds the `hotRef`, registers the context and the tools, renders the grid, and adds the chat:

```tsx
'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CopilotSidebar, useAgentContext, useFrontendTool } from '@copilotkit/react-core/v2';
import { type HotTableRef } from '@handsontable/react-wrapper';
import { z } from 'zod';
import { Grid } from './Grid';
import { createSpreadsheet, setCells, undo, type Cell } from './operations';

export function SpreadsheetCanvas() {
  const hotRef = useRef<HotTableRef>(null);
  // A blank starter, passed once, so the instance exists before the agent builds anything.
  const initialData = useRef<Cell[][]>(Array.from({ length: 5 }, () => Array(5).fill('')));
  const initialColumns = useRef<string[]>([]);

  // ...snapshot, context, and the three tools from Steps 3 and 4...

  return (
    <>
      <Grid
        hotRef={hotRef}
        initialColumns={initialColumns.current}
        initialData={initialData.current}
        onMutate={snapshot}
      />
      <CopilotSidebar />
    </>
  );
}
```

Wrap the app in the `CopilotKit` provider once, above the canvas. On Copilot Cloud a public key is all it needs, and there is no self-hosted route to run:

```tsx
// app/layout.tsx
import { CopilotKit } from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotKit publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_API_KEY!}>
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

Ask the chat for "a three-month budget with income, expenses, and a net row", then "raise February groceries to 900", then "undo that". The agent calls `createSpreadsheet`, then `setCells`, then `undo`, and HyperFormula recomputes after each.

## Connect a real agent

The demo runs a script in place of the model. To drive the grid from a real agent, keep the grid, the operations, the context, and the tools, and give the provider a backend:

- **Copilot Cloud** is the shortest path. Create a free key at [cloud.copilotkit.ai](https://cloud.copilotkit.ai), set it as `publicApiKey` on the provider, and pick a model in the dashboard. The tools and context you registered are sent to the model as-is.
- **A self-hosted runtime** keeps the model call on your own server. Point the provider at your runtime endpoint instead of a public key, and hold the model's API key there.

Either way, the model call and its key belong on a server or on Cloud, never in the client. The browser only decides what the agent may read and do, through the context and the tools.

## Match your design system

The grid uses the default `ht-theme-main` theme, which adapts to light and dark. Swap the imported theme stylesheet, or [register a custom theme](@/guides/styling/theme-customization/theme-customization.md) that maps your design tokens to Handsontable's, and the agent's grid looks like every other grid in your product.

CopilotKit's chat is themed separately. Its v2 stylesheet ships light and dark styles; import it once, as the provider snippet does.

## Known limitations

- The agent reads the sheet through the snapshot that `useAgentContext` exposes. It learns about a user's edit on its next turn, once the snapshot has refreshed, not the instant the user types.
- Sorting, filtering, and row or column moving all change what the in-grid aggregate formulas cover, so this recipe leaves them off and lets the agent own the shape of the sheet. Per-row relative formulas such as `=B1-C1` survive a reorder; ranges and totals such as `=SUM(D1:D3)` do not. For column totals that survive sorting, compute them with the [`ColumnSummary`](@/guides/columns/column-summary/column-summary.md) plugin instead of an in-grid `=SUM` cell.
- `createSpreadsheet` replaces the sheet through [`updateData`](@/api/core.md#updatedata), which clears the undo history -- the recorded steps describe the dataset it replaced. Undo spans agent and user edits within a sheet, but it cannot restore the sheet that `createSpreadsheet` overwrote.
- Keep tool handlers idempotent, and guard a non-idempotent action such as `undo`, so a tool call that arrives twice cannot revert two steps.

## Related

<div class="boxes-list">

- [Agent-driven grid with A2UI](@/recipes/real-time/a2ui-agent-grid/a2ui-agent-grid.md)
- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md)

</div>

## What you learned

- How `useFrontendTool` registers a function the agent can call, and how `useAgentContext` gives the agent a read-only view of the grid.
- How to let Handsontable own its data and keep only a read-only snapshot in React, so the agent's edits and the user's share one undo stack.
- How to give an agent a grid that computes: the agent writes formulas, HyperFormula evaluates them, and the agent never does arithmetic.
- Why `setDataAtCell` keeps formulas and undo working where `setSourceDataAtCell` would not, and why the grid must be memoized.
- Why sorting, filtering, and row moving stay off when the grid holds formulas the agent depends on.

## Next steps

- Add a tool for a structural edit, such as `addColumn` or `insertRow`, by copying the `useFrontendTool` pattern and calling one more operation.
- Expose the selected cell in the context, so the user can ask the agent about "this cell".
- Compare with the [agent-driven grid with A2UI](@/recipes/real-time/a2ui-agent-grid/a2ui-agent-grid.md), where the agent describes the grid instead of calling tools against it.

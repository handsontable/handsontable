---
type: how-to
title: Agent-driven grid with A2UI
metaTitle: Agent-driven grid with A2UI - React Data Grid | Handsontable
description: Let an AI agent render and update a Handsontable grid through the A2UI protocol. Build a HotGrid catalog component that evaluates agent-authored formulas with HyperFormula and sends edits back to the agent.
permalink: /recipes/real-time/a2ui-agent-grid
canonicalUrl: /recipes/real-time/a2ui-agent-grid
framework: react
tags:
  - a2ui
  - generative-ui
  - agent
  - ai
  - hyperformula
  - formulas
  - tutorial
  - recipes
react:
  metaTitle: Agent-driven grid with A2UI - React Data Grid | Handsontable
searchCategory: Recipes
category: Real-time & Integrations
menuTag: new
---

In this tutorial, you will let an AI agent describe a grid in [A2UI](https://a2ui.org/) JSON and have Handsontable render it. You will build a custom A2UI component, `HotGrid`, that evaluates agent-authored formulas with HyperFormula in the browser, applies the agent's follow-up updates in place, and sends the user's edits back to the agent.

<iframe src="https://demos.handsontable.com/embed/34326g6e4v"
  style="width:100%; height: 820px; border:0; border-radius: 4px; overflow:hidden;"
  title="Agent-driven purchase order review with A2UI and HotGrid"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**View the code**](https://demos.handsontable.com/share/34326g6e4v) · [**Open in the demo runner**](https://demos.handsontable.com/edit/34326g6e4v)

The grid above is not hand-coded in the page. An agent described it in A2UI JSON: a `HotGrid` component from a custom catalog, bound to `/rows` in the surface data model. `HotGrid` renders it with Handsontable and evaluates the `=` cells with HyperFormula, in the browser. Edit a cell and click **Send to agent**: the action carries both the formulas (`rows`) and the computed numbers (`values`) back to the agent, and the agent answers with new messages. Here it adds a volume-discount line to the rows you sent, so your edits stay, and every reply is appended to the list under the grid. The two panels below the grid show the agent-to-client message stream and the client-to-agent actions.

**Note:** in this demo the agent's messages come from a fixed script and a small reply function that stands in for the model, so there is no backend and no API key. The last section shows where a real agent plugs in.

<script>
  // Keep the embedded demos in the same light/dark mode as this page. The
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

A2UI is an open protocol, led by Google, in which an agent sends a declarative description of a user interface instead of code. The description names components from a **catalog** that the client controls, so the agent can only render what you allow. The client keeps a **data model** per surface, components bind to paths in it, and user actions carry parts of it back to the agent.

The A2UI basic catalog has no table or grid component. This recipe adds one. `HotGrid` is a catalog component whose props are a Zod schema (the API the agent sees) and whose implementation mounts Handsontable with the HyperFormula engine. The agent writes columns, rows, and `=` formulas. The grid computes the numbers. The agent never does arithmetic.

**Difficulty:** Intermediate
**Time:** ~25 minutes
**Stack:** React, `@a2ui/react` 0.12 (A2UI v0.9 protocol), Handsontable, HyperFormula

## What You'll Build

- A `HotGrid` A2UI component with a typed API: column labels, optional cell types, rows bound to the data model, and a `values` binding for computed results.
- A catalog that contains the A2UI basic components plus `HotGrid`, which the agent selects by id.
- A page that feeds agent messages to the A2UI message processor, renders the surface, forwards every user action to a reply function that stands in for the model, and logs both directions.
- A second message script in which the agent keeps editing the grid it already rendered, one cell at a time.

## Before you begin

This recipe assumes a React app built with Vite. Install the dependencies:

```shell
npm install handsontable hyperformula @a2ui/react @a2ui/web_core zod@3
```

`@a2ui/react` declares a peer dependency on Zod 3, so pin that major.

## Step 1: Define the HotGrid component

::: example #hotgrid-tsx --code-only

@[code ts](@/content/recipes/real-time/a2ui-agent-grid/react/HotGrid.tsx)

:::

**What's happening:** the file has two halves. `HotGridApi` is the contract: a name and a Zod schema. `createComponentImplementation` pairs that contract with a React function and returns a component the catalog can register.

The schema uses the common A2UI types where they exist, so the agent gets the same binding rules as the basic catalog:

```typescript
columns: CommonSchemas.DynamicStringList,
rows: z.union([z.array(z.array(cellSchema)), CommonSchemas.DataBinding]),
values: z.union([z.array(z.array(cellSchema)), CommonSchemas.DataBinding]).optional(),
readOnly: CommonSchemas.DynamicBoolean.optional(),
```

A `DynamicStringList` accepts a literal array or a `{ path }` into the data model. `rows` and `values` do the same for a 2D array of cells. Before the React function runs, the A2UI **generic binder** resolves every `{ path }` to its current value, and for each bound prop it injects a setter: `props.setRows` and `props.setValues`. Calling a setter writes to the data model, which is how the grid reports its state back.

**Why `DynamicStringList` and not `z.array(z.string())`:** the binder treats a plain array of strings as a list of child component ids and tries to resolve each one as a component. `DynamicStringList` is the A2UI type for an ordinary list of strings.

The React function mounts Handsontable once and never rebuilds it:

```typescript
const hot = new Handsontable(containerRef.current, {
  data: rows.map((r) => [...r]),
  colHeaders: props.columns,
  columns: props.columnTypes?.map((type) => ({ type: String(type) })),
  formulas: { engine: HyperFormula },
  columnSorting: false,
  filters: false,
  manualRowMove: false,
  afterChange: (_changes, source) => {
    if (source !== 'loadData' && source !== 'updateData') syncToDataModel();
  },
  // ...
});
```

`formulas: { engine: HyperFormula }` turns every cell that starts with `=` into a live formula. After each user edit, `syncToDataModel` writes two things: `getSourceData()` (the cells with their formulas intact) into `rows`, and `getData()` (the computed values) into `values`. The agent can read whichever it needs.

**Light and dark mode:** the component passes `themeName` at construction and calls `useTheme()` whenever the page's mode changes, switching between `ht-theme-main` and `ht-theme-main-dark`. The mode comes from a small `theme.ts` module that reads a `?theme=` query parameter, a `postMessage` from the embedding page, or the OS preference, in that order, and forces the page's `color-scheme` so the A2UI components and the grid agree. demos.handsontable.com's embed wrapper speaks the same message protocol, which is how the demos on this page follow the docs theme.

::: example #theme-ts --code-only

@[code ts](@/content/recipes/real-time/a2ui-agent-grid/react/theme.ts)

:::

**Why structural changes are off:** sorting, filtering, and row moving operate on visual indexes and rewrite in-grid aggregate formulas such as `=SUM(D1:D4)`, so an agent-authored total would silently change. Inserting or removing rows shifts the ranges those formulas cover, so a line added below the last item would fall outside the total. The component therefore turns those plugins off and limits the context menu to undo and redo. The user edits values; the agent owns the shape of the sheet and rewrites the formulas when it adds or removes rows, as the reply in Step 5 does.

## Step 2: Register a catalog

::: example #catalog-ts --code-only

@[code ts](@/content/recipes/real-time/a2ui-agent-grid/react/catalog.ts)

:::

**What's happening:** a `Catalog` is an id, a protocol version, and the components and functions it contains. This one copies everything from the basic catalog that ships with `@a2ui/react` and adds `HotGrid`. The id is a string the agent quotes in `createSurface`; by convention it looks like a URL, but nothing is fetched from it.

Keep the id stable. Once a surface is created with a catalog id, that id is fixed for the surface's lifetime.

## Step 3: Process messages and render the surface

::: example #app-tsx --code-only

@[code ts](@/content/recipes/real-time/a2ui-agent-grid/react/App.tsx)

:::

**What's happening:** `MessageProcessor` is the A2UI client runtime. It takes the catalogs it may render from and an action handler. Every message from the agent goes through `processMessages`, which creates or updates surfaces. The page subscribes to `onSurfaceCreated` and `onSurfaceDeleted`, keeps the surface list in React state, and renders each one with `A2uiSurface`.

The action handler receives an `ActionPayload` each time the user triggers an action in the surface: the action name, the surface and component ids, a timestamp, and the resolved `context`. The demo's handler logs the payload, then calls `replyTo(action)` after a short delay and feeds the returned messages back into the processor. In a real app the handler forwards the payload to the agent over your transport, and the agent's response arrives the same way the first messages did.

The page's styling is plain CSS in `styles.css`. The one part worth noting is that it reserves the surface's height, for the reason the next paragraph gives.

The replay loop sends the three opening messages together, the way a model's first response arrives, and paces any later messages out so the agent's follow-up edits are visible one at a time. Sending the opening messages one by one made the page jump three times as the surface, then the components, then the data appeared; the page also reserves the surface's height in CSS for the same reason.

## Step 4: What the agent sends

::: example #agent-messages-ts --code-only

@[code ts](@/content/recipes/real-time/a2ui-agent-grid/react/agentMessages.ts)

:::

**What's happening:** three message types build the surface.

- `createSurface` names the surface, picks the catalog by id, and sets `sendDataModel: true`. With that flag the client attaches the surface's whole data model to every message it sends to the agent, so the agent always sees the current state.
- `updateComponents` is a flat list of components with ids. `root` is required. Containers such as `Column` and `Row` reference their children by id, which is why the list can stream incrementally. The `HotGrid` entry binds `rows` to `/rows` and `values` to `/values`. The `List` at the bottom binds to `/log` and expands its `log_item` `Text` template once per entry, so every message the agent writes appears in order under the grid.
- `updateDataModel` writes a value at a path. Here it fills the root with `log` (one entry) and `rows`.

The row data holds formulas as strings. `=B1*C1` is a per-row formula and `=SUM(D1:D4)` an aggregate. HyperFormula evaluates both.

After these three messages the agent waits. Nothing else happens until the user acts.

## Step 5: Send edits back to the agent

The button's `action` lists the paths whose values should travel with the event:

```typescript
action: {
  event: {
    name: 'submit_purchase_order',
    context: { rows: { path: '/rows' }, values: { path: '/values' } },
  },
},
```

**What's happening:** in A2UI, two-way binding is local. Typing in the grid updates the data model through `setRows` and `setValues`, but nothing leaves the client until an action fires. When the user clicks **Send to agent**, the client resolves each entry in `context` against the data model at that moment and sends the result. The agent receives the formulas the user may have edited and the numbers HyperFormula computed from them, in one payload. Edit a quantity in the demo, click the button, and compare the two arrays in the **Client → agent** panel.

The agent then answers. In the demo, `replyTo` in `agentMessages.ts` stands in for the model:

```typescript
export function replyTo(action: ActionPayload): ProcessableMessage[] {
  const rows = (action.context.rows as Cell[][] | undefined) ?? [];
  // ...
  return [
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/rows', value: [...lineItems, discountRow, totalRow] } },
    { version: 'v0.9', updateDataModel: { surfaceId: SURFACE_ID, path: '/log', value: [...log, { text: 'Agent: ...' }] } },
  ];
}
```

It reads the rows from the action, so the user's edits survive, inserts a volume-discount line before the grand total, and rewrites the total's formula to cover the new range. The reply is an ordinary list of `updateDataModel` messages fed to the same `MessageProcessor`, which is what a real agent streams back. `HotGrid` applies the new rows with `updateData()` (Example 2 explains how), and HyperFormula recomputes the totals. Each reply also appends a line to the log. The action's `context` includes `log: { path: '/log' }`, so the agent receives the current list and sends it back with one more entry; `updateDataModel` replaces the value at a path, so appending means sending the whole array. A second send gets a log entry only.

## Example 2: Let the agent keep editing the grid

<iframe src="https://demos.handsontable.com/embed/04w5t294ua"
  style="width:100%; height: 820px; border:0; border-radius: 4px; overflow:hidden;"
  title="An agent updates a reorder plan cell by cell through A2UI"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**View the code**](https://demos.handsontable.com/share/04w5t294ua) · [**Open in the demo runner**](https://demos.handsontable.com/edit/04w5t294ua)

Here the agent renders a reorder plan, then keeps editing it. Watch the message stream under the grid: after the first three messages the agent sends only partial `updateDataModel` messages. One targets a single cell (`/rows/2/2`), one replaces the row list to add a SKU. The grid applies each one with `updateData()`, so it is never rebuilt, and HyperFormula recomputes the order quantities and totals. Edit any number and click **Approve plan** or **Ask for changes**: the action carries the formulas and the computed values to the agent, which appends its answer to the list.

**Note:** as in the first demo, the agent is a fixed script plus a reply function, so there is no backend and no API key.

The component, catalog, and page are the same. Only the message script and the reply function change. Here the agent does not wait for the user: it renders the plan, then keeps sending partial updates on its own, and answers **Approve plan** or **Ask for changes** with a new line in the log.

::: example #agent-messages-incremental-ts --code-only

@[code ts](@/content/recipes/real-time/a2ui-agent-grid/react/agentMessages.incremental.ts)

:::

**What's happening:** after the surface exists, the agent sends only partial `updateDataModel` messages. One targets a single cell:

```typescript
{ version: 'v0.9', updateDataModel: { surfaceId, path: '/rows/2/2', value: 60 } }
```

The bound `rows` prop re-resolves with that one cell changed. `HotGrid` compares the new rows with what it last wrote to the data model, sees that this change did not come from the grid, and calls `updateData()` on the existing instance:

```typescript
useEffect(() => {
  const hot = hotRef.current;
  if (!hot || rowsKey === lastSyncedKey.current) return;
  hot.updateData(rows.map((r) => [...r]));
  propsRef.current.setValues?.(hot.getData() as Cell[][]);
}, [rowsKey]);
```

`updateData` replaces the cells without destroying the instance, so column widths and the HyperFormula engine survive, and the order quantities and totals recompute from the new reorder point. The later message that adds a row works the same way with a full `/rows` replacement.

**Why compare against `lastSyncedKey`:** the grid's own `setRows` call also changes `/rows`, which re-resolves the prop. Without the guard, every user edit would be echoed back into `updateData` and interrupt the editor.

## Connect a real agent

The demos replay a script. To drive `HotGrid` from a model, keep the component and catalog, and replace the replay loop with a transport:

- **CopilotKit** ships an A2UI renderer that accepts a custom catalog. Define the component with `createCatalog(definitions, renderers)` from `@copilotkit/a2ui-renderer` and pass it as `a2ui={{ catalog }}` on the `<CopilotKit>` provider. See the [CopilotKit A2UI guide](https://docs.copilotkit.ai/generative-ui/a2ui).
- **A2A** and **AG-UI** carry A2UI messages between a remote agent and your client. The [A2UI documentation](https://a2ui.org/) has a guide for each transport, and the Python `a2ui-agent-sdk` package generates the messages on the agent side.
- Give the agent the catalog schema. `hotCatalog.catalogSchema` returns the JSON Schema for every registered component, including `HotGrid`, which is what the model needs in its context to produce valid messages.

The model call and its API key belong on a server. The client only ever receives A2UI JSON, which is data, not code.

## Match your design system

An A2UI catalog is meant to reflect the host application's own components, so an agent-rendered grid should look like every other grid in your product. `HotGrid` uses the default `ht-theme-main` theme. Swap the imported theme stylesheet, or [register a custom theme](@/guides/styling/theme-customization/theme-customization.md) that maps your design tokens to Handsontable's, and every surface the agent creates follows it.

## Known limitations

- Two-way binding is client-local. The agent learns about edits only when an action fires or, with `sendDataModel: true`, when the client sends its next message.
- Sorting, filtering, row moving, and user-driven row insert or remove all change what aggregate formulas in the grid cover, so `HotGrid` disables them and leaves row changes to the agent.
- The A2UI protocol is at v0.9.1, with v1.0 a release candidate. This recipe targets the v0.9 import paths of `@a2ui/react` and `@a2ui/web_core`.

## Related

<div class="boxes-list">

- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)
- [Theme customization](@/guides/styling/theme-customization/theme-customization.md)
- [Real-time updates via WebSocket](@/recipes/real-time/websocket-updates/websocket-updates.md)

</div>

## What you learned

- How an A2UI catalog component pairs a Zod schema with a React implementation, and how the generic binder resolves `{ path }` bindings and injects setters.
- How to give an agent a grid that computes: Handsontable renders, HyperFormula evaluates the agent's formulas, and the agent never does arithmetic.
- How `updateDataModel` messages reach the grid and why `updateData()` keeps the instance alive across them.
- How an action's `context` carries both formulas and computed values back to the agent.
- Why sorting, filtering, and user-driven row changes stay off when the grid holds formulas the agent depends on.

## Next steps

- Register `HotGrid` in a CopilotKit catalog and let a model choose it from a chat prompt.
- Add a `checks` rule to the schema so the surface can validate a row before the action fires.
- Compare with the [Liveblocks multiplayer recipe](@/recipes/real-time/liveblocks-multiplayer/liveblocks-multiplayer.md), where the other editor is a person instead of an agent.

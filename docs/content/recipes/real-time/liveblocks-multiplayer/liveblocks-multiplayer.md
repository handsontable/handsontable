---
type: how-to
title: Multiplayer editing with Liveblocks
metaTitle: Multiplayer editing with Liveblocks - React Data Grid | Handsontable
description: Turn Handsontable into a multiplayer grid with Liveblocks. Sync cell values through Storage, share each user's selection through Presence, and draw live selection borders with a custom renderer.
permalink: /recipes/real-time/liveblocks-multiplayer
canonicalUrl: /recipes/real-time/liveblocks-multiplayer
framework: react
tags:
  - liveblocks
  - multiplayer
  - real-time
  - presence
  - collaboration
  - tutorial
  - recipes
react:
  metaTitle: Multiplayer editing with Liveblocks - React Data Grid | Handsontable
searchCategory: Recipes
category: Real-time & Integrations
menuTag: new
---

In this tutorial, you will turn Handsontable into a multiplayer grid with [Liveblocks](https://liveblocks.io). You will learn how to sync cell values through Liveblocks Storage, share each user's selected cell through Presence, and draw live selection borders for other users with a custom cell renderer.

## Overview

<a class="github-example-cta" href="https://liveblocks.io/examples/multiplayer-handsontable/nextjs-multiplayer-handsontable?exampleId=eiEHIYTZAY50Opg" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  Try the live example on Liveblocks
</a>

![Multiplayer spreadsheet editing with Liveblocks: several users editing the same grid with colored selection cursors](/img/pages/liveblocks/multiplayer.jpg)

This recipe connects Handsontable to [Liveblocks](https://liveblocks.io), a hosted real-time collaboration service. Two kinds of state travel over the Liveblocks room. The grid's cell values live in **Storage** (the shared document every user edits), and each user's currently selected cell lives in **Presence** (ephemeral per-user state). A custom renderer reads the presence of other users and paints a colored border on the cells they have selected, so everyone sees where everyone else is working.

Liveblocks runs against a hosted backend that needs your own API key, so the grid cannot run inside this page. The code below is the complete client. Follow the steps to wire it into a Next.js app, or open the live example above.

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Stack:** Next.js (App Router), React, Liveblocks, Handsontable, `@handsontable/react-wrapper`

## What You'll Build

A shared data grid where every connected user:

- Edits the same cells in real time, so a change made by one user appears in every other user's grid
- Sees a colored border on the cell each other user has selected, with stacked borders when several users sit on the same cell
- Joins through a single Liveblocks room with an initial 10×5 empty grid

## Before you begin

This recipe assumes a Next.js app using the App Router. You also need a free [Liveblocks account](https://liveblocks.io) to get a public API key.

Install the dependencies:

```shell
npm install @liveblocks/client @liveblocks/react @handsontable/react-wrapper handsontable
```

Scaffold the Liveblocks configuration:

```shell
npx create-liveblocks-app@latest --init --framework react
```

Copy your public API key from the [Liveblocks dashboard](https://liveblocks.io/dashboard) and use it in place of `{{PUBLIC_KEY}}` in `Room.tsx` (Step 2).

## Step 1: Define Presence and Storage types

:::example #liveblocks-config --code-only

@[code ts](@/content/recipes/real-time/liveblocks-multiplayer/react/liveblocks.config.ts)

:::

**What's happening:** The global `Liveblocks` interface tells the Liveblocks hooks the exact shape of your room. `Storage` is the persisted, shared document: a `LiveList` of rows, each itself a `LiveList` of cell strings, so it can be mutated cell-by-cell without replacing the whole grid. `Presence` is each user's ephemeral state: the row and column of their selected cell, or `null` when nothing is selected.

**Why a nested `LiveList`?** A `LiveList<LiveList<string>>` lets two users edit different cells at the same time without conflict. Setting one cell calls `row.set(colIndex, value)` on only that inner list, so Liveblocks merges concurrent edits instead of replacing the entire grid.

## Step 2: Set up the room

:::example #room-tsx --code-only

@[code ts](@/content/recipes/real-time/liveblocks-multiplayer/react/Room.tsx)

:::

**What's happening:** `LiveblocksProvider` connects the app to your Liveblocks project with the public API key. `RoomProvider` joins the room `"my-room"` and seeds it: `initialPresence` starts every user with no selected cell, and `initialStorage` builds a 10×5 grid of empty strings the first time the room is created. `ClientSideSuspense` holds back the children until the room's storage has loaded.

## Step 3: Wire up the page

:::example #page-tsx --code-only

@[code ts](@/content/recipes/real-time/liveblocks-multiplayer/react/page.tsx)

:::

**What's happening:** The page renders the `Table` inside the `Room`, so every Liveblocks hook the table uses resolves against the joined room.

## Step 4: Read and write cell values through Storage

::: only-for react

::: example #table-component --code-only

@[code](@/content/recipes/real-time/liveblocks-multiplayer/react/Table.jsx)

:::

:::

The grid component above is the full client. The next steps walk through its three responsibilities, starting with reading and writing cell values:

```typescript
const data = useStorage(
  (root) =>
    root.grid.map((row) =>
      Array.from({ length: GRID_COLS }, (_, c) => String(row[c] ?? ""))
    ),
  shallow
);

const updateCell = useMutation(
  ({ storage }, rowIndex: number, colIndex: number, value: string) => {
    const grid = storage.get("grid");
    const row = grid.get(rowIndex);
    if (row) {
      row.set(colIndex, value);
    }
  },
  []
);
```

**What's happening:** `useStorage` projects the `LiveList` grid into a plain `string[][]` that Handsontable accepts as its `data`, and re-runs whenever storage changes, so a remote edit flows straight into the grid. The `shallow` comparison stops needless re-renders when the projected array is structurally unchanged. `useMutation` returns `updateCell`, which writes a single cell back into storage; Liveblocks broadcasts that write to every other user.

**Why `setDataAtCell` is not used here:** the grid's `data` is driven entirely by `useStorage`. You never imperatively set cell values. You mutate storage, and the storage subscription re-feeds `data`, which keeps one source of truth.

## Step 5: Sync edits and selection to the room

```typescript
const afterChange = useCallback(
  (changes: CellChange[] | null, source: ChangeSource) => {
    if (!changes || source === "loadData") {
      return;
    }

    for (const [row, prop, , newVal] of changes) {
      if (typeof prop !== "number") {
        continue;
      }

      updateCell(
        row,
        prop,
        newVal === null || newVal === undefined ? "" : String(newVal)
      );
    }
  },
  [updateCell]
);

const syncSelectedCellToPresence = useMutation(
  ({ setMyPresence }, row: number, col: number) => {
    setMyPresence({
      selectedCell: { row: row < 0 ? 0 : row, col: col < 0 ? 0 : col },
    });
  },
  []
);

const clearSelectedCellPresence = useMutation(({ setMyPresence }) => {
  setMyPresence({ selectedCell: null });
}, []);
```

**What's happening:** `afterChange` runs on every local edit. It skips the initial `loadData` pass, then calls `updateCell` for each changed cell so the edit reaches storage. `afterSelection` is wired to `syncSelectedCellToPresence`, which writes the selected cell into the user's presence; the `< 0 ? 0` guards clamp Handsontable's header coordinates (`-1`) to a valid cell. `afterDeselect` clears presence so the border disappears when the user clicks away.

## Step 6: Render other users' selections

```typescript
const renderDataCell = useMutation(
  ({ others }, ...props: Parameters<typeof textRenderer>) => {
    textRenderer(...props);
    const [, td, row, col] = props;

    const selectedOthers = others.filter(
      (o) =>
        o.presence.selectedCell?.row === row &&
        o.presence.selectedCell?.col === col
    );

    if (!selectedOthers.length) {
      td.style.boxShadow = "";
      return;
    }

    td.style.boxShadow = selectedOthers
      .map((p, i) => `inset 0 0 0 ${2 + i * 2}px ${p.info.color}`)
      .join(", ");
  },
  []
);

useOthersListener(({ type }) => {
  if (type === "update") {
    hotRef.current?.hotInstance?.render();
  }
});
```

**What's happening:** `renderDataCell` is passed to Handsontable as `hotRenderer`. It first calls the built-in `textRenderer` to paint the value, then reads `others` (the presence of every other user in the room) and finds those whose `selectedCell` matches this cell. For each match it stacks an `inset` box-shadow in that user's color, so two users on the same cell show two nested borders. `useOthersListener` re-renders the grid whenever another user's presence changes, so borders follow them as they move.

**Why force a render?** Handsontable does not know that remote presence changed. `useOthersListener` bridges that gap: on every presence `update`, it calls `hotInstance.render()` so the renderer re-runs with the new selection data.

## How It Works - Complete Flow

1. **A user joins**: `RoomProvider` connects to `"my-room"`; `ClientSideSuspense` waits for storage, then `useStorage` feeds the 10×5 grid into Handsontable.
2. **User A edits a cell**: `afterChange` fires, `updateCell` writes the value into the `LiveList` grid in storage.
3. **Liveblocks broadcasts** the storage change to everyone in the room.
4. **User B's grid updates**: their `useStorage` subscription re-runs, returning the new `string[][]`, and Handsontable shows the edit, with no manual `setDataAtCell` call.
5. **User A selects a cell**: `afterSelection` writes `{ row, col }` into User A's presence via `setMyPresence`.
6. **User B sees the selection**: `useOthersListener` catches the presence `update` and re-renders; `renderDataCell` finds User A among `others` on that cell and draws a border in User A's color.
7. **User A clicks away**: `afterDeselect` sets presence back to `null`, and User B's next render clears the border.

## What you learned

- How to model shared grid data as a nested Liveblocks `LiveList` so concurrent cell edits merge instead of overwriting each other.
- How `useStorage` makes Liveblocks storage the single source of truth for Handsontable's `data`, removing the need for imperative cell updates.
- How `useMutation` writes both shared storage (cell values) and per-user presence (selection) back to the room.
- How a custom `hotRenderer` reads the presence of `others` and paints stacked selection borders in each user's color.
- How `useOthersListener` re-renders the grid when remote presence changes so live cursors stay in sync.

## Next steps

- Add [authentication](https://liveblocks.io/docs/authentication) so only permitted users can join a room, instead of using a public API key in the client.
- Add comments anchored to cells with the [Liveblocks comments recipe](@/recipes/real-time/liveblocks-comments/liveblocks-comments.md).
- Show a live avatar stack of who is in the room using the same `others` presence data.
- Compare with the [WebSocket updates recipe](@/recipes/real-time/websocket-updates/websocket-updates.md) to see a backend-agnostic real-time pattern that updates cells with `setDataAtCell`.

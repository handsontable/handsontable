---
type: how-to
title: Cell comments with Liveblocks
metaTitle: Cell comments with Liveblocks - React Data Grid | Handsontable
description: Add threaded comments anchored to individual Handsontable cells with Liveblocks Comments. Attach threads to a cell through thread metadata and render comment pins with a custom cell renderer.
permalink: /recipes/real-time/liveblocks-comments
canonicalUrl: /recipes/real-time/liveblocks-comments
framework: react
tags:
  - liveblocks
  - comments
  - threads
  - collaboration
  - real-time
  - tutorial
  - recipes
react:
  metaTitle: Cell comments with Liveblocks - React Data Grid | Handsontable
searchCategory: Recipes
category: Real-time & Integrations
menuTag: new
---

In this tutorial, you will add threaded comments anchored to individual Handsontable cells with [Liveblocks](https://liveblocks.io) Comments. You will learn how to attach a comment thread to a cell through thread metadata, and how to render a comment pin and composer inside a cell with a custom renderer.

## Overview

<a class="github-example-cta" href="https://liveblocks.io/examples/handsontable-comments/nextjs-comments-handsontable?exampleId=eiEHIYTZAY50Opg" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  Try the live example on Liveblocks
</a>

![Threaded comments anchored to a Handsontable cell with Liveblocks Comments](/img/pages/liveblocks/comments.png)

This recipe adds [Liveblocks Comments](https://liveblocks.io/docs/products/comments) to a Handsontable grid so users can discuss individual cells. Each comment thread carries metadata (the cell's `rowId` and `columnId`) that anchors the thread to one cell. A custom cell renderer reads the threads for the room, finds the one matching the cell, and shows either a "start a comment" pin or the existing thread.

Liveblocks Comments runs against a hosted backend that needs your own API key, so the grid cannot run inside this page. The code below is the complete client. Follow the steps to wire it into a Next.js app, or open the live example above.

**Difficulty:** Intermediate
**Time:** ~20 minutes
**Stack:** Next.js (App Router), React, Liveblocks Comments, `@liveblocks/react-ui`, Handsontable, `@handsontable/react-wrapper`

## What You'll Build

A data grid where every cell can hold a comment thread:

- Hovering a cell reveals a pin to start a comment on that cell
- A cell with an existing thread shows a filled pin; clicking it opens the thread
- Threads are anchored to a stable `rowId` (the row's `id` field) and `columnId` (the column key), so they stay attached to the right data even as rows reorder

## Before you begin

This recipe assumes a Next.js app using the App Router. You also need a free [Liveblocks account](https://liveblocks.io) to get a public API key.

Install the dependencies:

```shell
npm install @liveblocks/client @liveblocks/react @liveblocks/react-ui @handsontable/react-wrapper handsontable
```

Scaffold the Liveblocks configuration:

```shell
npx create-liveblocks-app@latest --init --framework react
```

Copy your public API key from the [Liveblocks dashboard](https://liveblocks.io/dashboard) and use it in place of `{{PUBLIC_KEY}}` in `Room.tsx` (Step 3).

## Step 1: Define the thread metadata

:::example #liveblocks-config --code-only

@[code ts](@/content/recipes/real-time/liveblocks-comments/react/liveblocks.config.ts)

:::

**What's happening:** `ThreadMetadata` declares the custom fields stored on every comment thread. Here a thread carries the `rowId` and `columnId` of the cell it belongs to. Liveblocks lets you query and filter threads by this metadata, which is how each cell finds its own thread.

**Why anchor to `rowId`, not the visual row index?** A row's position changes when the grid is sorted or rows are inserted, but its `id` does not. Anchoring to a stable `rowId` keeps a comment attached to the same record no matter where it renders.

## Step 2: Import the Comments styles

Import the default Liveblocks UI styles once, in your root layout:

```typescript
import "@liveblocks/react-ui/styles.css";
```

Then add the cell-level styles. The comment pin is hidden until you hover the cell, and cells get enough height to sit a pin comfortably:

:::example #globals-css --code-only

@[code css](@/content/recipes/real-time/liveblocks-comments/react/globals.css)

:::

**What's happening:** `@liveblocks/react-ui/styles.css` styles the composer and thread UI. The `.comment-cell-trigger` rule keeps the "add comment" pin invisible until the row is hovered (or the composer is open), so the grid stays uncluttered.

## Step 3: Set up the room

:::example #room-tsx --code-only

@[code ts](@/content/recipes/real-time/liveblocks-comments/react/Room.tsx)

:::

**What's happening:** `LiveblocksProvider` connects to your Liveblocks project, `RoomProvider` joins the room `"my-room"`, and `ClientSideSuspense` waits for the room to load before rendering. Comments need no `initialStorage`, because threads are stored by the Comments product, not in room storage.

## Step 4: Share threads through React context

:::example #cell-thread-context --code-only

@[code ts](@/content/recipes/real-time/liveblocks-comments/react/CellThreadContext.tsx)

:::

**What's happening:** `useThreads` returns every comment thread in the room. The provider puts that list, plus an `openCell` state, on a context so each rendered cell can read it without calling `useThreads` itself. `openCell` tracks which cell's thread should open automatically, for example right after a user posts the first comment on a cell.

**Why one `useThreads` call?** Handsontable re-renders cells frequently. Calling `useThreads` once at the provider and sharing the result through context avoids one subscription per cell.

## Step 5: Build the comment cell renderer

:::example #comment-cell --code-only

@[code ts](@/content/recipes/real-time/liveblocks-comments/react/CommentCell.tsx)

:::

**What's happening:** `CommentCell` is a React renderer for Handsontable. From the renderer props it derives the cell's `columnId` (the column key) and `rowId` (read from the row's `id` field via `instance.getDataAtRowProp`). `CommentCellBody` then looks up the thread whose metadata matches this cell:

- **No thread yet**: it renders a `FloatingComposer` behind a `CommentPin` with a plus icon. Submitting the composer creates a thread with `metadata = { rowId, columnId }`, anchoring it to this cell.
- **Thread exists**: it renders a `FloatingThread` behind a filled `CommentPin`. Clicking the pin opens the existing conversation.

`useSelf` reads the current user's id so the new-comment pin shows their avatar.

## Step 6: Wire the renderer into the grid

::: only-for react

::: example #collaborative-app --code-only

@[code](@/content/recipes/real-time/liveblocks-comments/react/CollaborativeApp.jsx)

:::

:::

**What's happening:** `CollaborativeApp` wraps the grid in `CellThreadProvider` (Step 4) and assigns `CommentCell` as the `renderer` for each `HotColumn`. The columns are `readOnly` so clicks open comments instead of starting cell edits, and `minRowHeights={50}` gives each row room for a pin. Finally, the page renders `CollaborativeApp` inside the `Room`:

:::example #page-tsx --code-only

@[code ts](@/content/recipes/real-time/liveblocks-comments/react/page.tsx)

:::

## How It Works - Complete Flow

1. **A user joins**: `RoomProvider` connects to `"my-room"`; `CellThreadProvider` calls `useThreads` once and shares the thread list through context.
2. **Handsontable renders a cell**: `CommentCell` derives `rowId` from the row's `id` and `columnId` from the column key.
3. **The cell finds its thread**: `CommentCellBody` searches the shared threads for one whose metadata matches `{ rowId, columnId }`.
4. **No thread**: hovering reveals a pin; the `FloatingComposer` creates a thread with that metadata on submit, anchoring it to the cell.
5. **Liveblocks broadcasts** the new thread; every user's `useThreads` updates and the matching cell now shows a filled pin.
6. **Thread exists**: clicking the pin opens a `FloatingThread` with the full conversation; replies sync to everyone in the room.
7. **Rows reorder**: because threads are keyed by the stable `rowId`, each comment stays attached to its record rather than a screen position.

## What you learned

- How to declare `ThreadMetadata` so each comment thread stores the cell it belongs to.
- Why anchoring threads to a stable `rowId` keeps comments attached through sorting and row inserts.
- How to call `useThreads` once and share the result through React context to avoid per-cell subscriptions.
- How a custom Handsontable renderer can host Liveblocks' `FloatingComposer`, `FloatingThread`, and `CommentPin` inside a cell.
- How `readOnly` columns let cell clicks open comments instead of starting an edit.

## Next steps

- Add [authentication](https://liveblocks.io/docs/authentication) so threads carry real user identities instead of a public API key in the client.
- Add multiplayer editing to the same grid with the [Liveblocks multiplayer recipe](@/recipes/real-time/liveblocks-multiplayer/liveblocks-multiplayer.md).
- Add a [notifications inbox](https://liveblocks.io/docs/products/comments) so users are alerted when someone replies to a thread they are part of.
- Show a count of open threads per row by grouping `useThreads` results by `rowId`.

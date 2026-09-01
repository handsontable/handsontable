---
type: how-to
title: Handling collaboration and simultaneous editing
metaTitle: Handling collaboration and simultaneous editing - JavaScript Data Grid | Handsontable
description: Coordinate edits between multiple users by detecting active edit state, intercepting local changes, and syncing structural and non-data changes across clients.
permalink: /collaboration
canonicalUrl: /collaboration
tags:
  - collaboration
  - real-time
  - hooks
react:
  metaTitle: Handling collaboration and simultaneous editing - React Data Grid | Handsontable
angular:
  metaTitle: Handling collaboration and simultaneous editing - Angular Data Grid | Handsontable
vue:
  metaTitle: Handling collaboration and simultaneous editing - Vue Data Grid | Handsontable
searchCategory: Guides
category: Data management
menuTag: new
---

Coordinate edits between multiple users by detecting active edit state, intercepting local changes, and syncing structural and non-data changes across clients.

[[toc]]

Handsontable doesn't ship a transport layer or a conflict-resolution algorithm. To build collaborative editing, you send local changes to your own backend (for example, a WebSocket server) and apply changes from other collaborators back into the grid. This guide covers the hooks and methods you use on both sides of that flow.

The examples on this page simulate a remote collaborator locally, so they run without a real backend. In your app, replace the simulated call with the message you receive from your collaboration server.

## Avoid overwriting a cell that's being edited

Applying a remote change to a cell while the local user is still typing in it discards their in-progress edit. Before applying a remote change, check whether the target cell's editor is open with [`getActiveEditor()`](@/api/core.md#getactiveeditor) and [`isOpened()`](@/api/baseEditor.md#isopened). If it is, wait until the local edit finishes, then apply the remote change.

Use the [`beforeChange`](@/api/hooks.md#beforechange) hook to read local edits and send them to other collaborators. Give changes that come from another collaborator a distinct `source` value, so your `beforeChange` handler doesn't broadcast them again.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/data-management/collaboration/javascript/example1.html)
@[code](@/content/guides/data-management/collaboration/javascript/example1.js)
@[code](@/content/guides/data-management/collaboration/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/data-management/collaboration/react/example1.jsx)
@[code](@/content/guides/data-management/collaboration/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/data-management/collaboration/angular/example1.ts)
@[code](@/content/guides/data-management/collaboration/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/data-management/collaboration/vue/example1.vue)

:::

:::

A simulated remote update to the **Status** column of the first row arrives 3 seconds after the example loads. Start editing that cell before then, and the remote change waits until you finish.

## Guard and replay structural changes

Row and column changes need the same two-way handling as cell data. Use [`beforeCreateRow`](@/api/hooks.md#beforecreaterow), [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow), [`beforeCreateCol`](@/api/hooks.md#beforecreatecol), and [`beforeRemoveCol`](@/api/hooks.md#beforeremovecol) to read local structural changes and forward them to other collaborators. Each hook receives the `source` argument you passed in, so you can skip re-broadcasting a change that a collaborator sent you.

To apply a structural change from another collaborator, call [`alter()`](@/api/core.md#alter) with the same `source` value:

```js
const configurationOptions = {
  beforeCreateRow(index, amount, source) {
    if (source === 'remotePeer') {
      // let a structural change from another collaborator through
      return;
    }

    // send the local structural change to your collaboration backend here
  },
  beforeRemoveRow(index, amount, physicalRows, source) {
    if (source === 'remotePeer') {
      return;
    }

    // send the local structural change to your collaboration backend here
  },
};

// apply a structural change received from another collaborator
hot.alter('insert_row_below', 2, 1, 'remotePeer');
```

## Sync cell metadata, comments, merged cells, and borders

Collaborators also share state that isn't part of the cell value. [`setCellMeta()`](@/api/core.md#setcellmeta) writes arbitrary metadata (for example, a `className` that flags a cell as locked by another user), but it doesn't repaint the grid on its own - call [`render()`](@/api/core.md#render) afterward.

The [`Comments`](@/api/comments.md), [`MergeCells`](@/api/mergeCells.md), and [`CustomBorders`](@/api/customBorders.md) plugins expose methods you can call with data received from another collaborator:

```js
// share arbitrary metadata, then repaint to apply it
hot.setCellMeta(1, 2, 'className', 'is-locked-by-remote-user');
hot.render();

// mirror a comment left by another collaborator
hot.getPlugin('comments').setCommentAtCell(1, 2, 'Reviewed - looks good.');

// mirror a merged area created by another collaborator
hot.getPlugin('mergeCells').merge(0, 0, 0, 1);

// mirror a border added by another collaborator
hot.getPlugin('customBorders').setBorders([[1, 1, 1, 1]], { start: { width: 2, color: '#2563eb' } });
```

The [`Comments`](@/api/comments.md) plugin stores comments as cell meta, so [`setCommentAtCell()`](@/api/comments.md#setcommentatcell) and [`removeCommentAtCell()`](@/api/comments.md#removecommentatcell) also trigger [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta) and [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta) - handle comment changes there if you're already syncing cell meta through those hooks.

## Result

After completing this guide, your grid detects when a remote update would overwrite a cell the local user is actively editing, broadcasts local data and structural changes to other collaborators, and mirrors remote changes to cell data, rows, columns, comments, merged cells, and borders.

## Related articles

<div class="boxes-list">

- [Events and hooks](@/guides/getting-started/events-and-hooks/events-and-hooks.md)
- [Comments](@/guides/cell-features/comments/comments.md)
- [Merge cells](@/guides/cell-features/merge-cells/merge-cells.md)

</div>

## Related API reference

**Core methods**

<div class="boxes-list">

- [alter()](@/api/core.md#alter)
- [getActiveEditor()](@/api/core.md#getactiveeditor)
- [render()](@/api/core.md#render)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setDataAtCell()](@/api/core.md#setdataatcell)

</div>

**Hooks**

<div class="boxes-list">

- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeChange](@/api/hooks.md#beforechange)
- [beforeCreateCol](@/api/hooks.md#beforecreatecol)
- [beforeCreateRow](@/api/hooks.md#beforecreaterow)
- [beforeRemoveCol](@/api/hooks.md#beforeremovecol)
- [beforeRemoveRow](@/api/hooks.md#beforeremoverow)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)

</div>

**Plugins**

<div class="boxes-list">

- [Comments](@/api/comments.md)
- [CustomBorders](@/api/customBorders.md)
- [MergeCells](@/api/mergeCells.md)

</div>

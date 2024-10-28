---
id: own6evdy
title: Events and hooks
metaTitle: Events and hooks - JavaScript Data Grid | Handsontable
description: Run your code before or after specific data grid actions, using Handsontable's API hooks (callbacks). For example, control what happens with the user's input.
permalink: /events-and-hooks
canonicalUrl: /events-and-hooks
tags:
- callback
- hook
- event
- middleware
- modify
- after
- before
- events
- hooks
react:
  id: d966se98
  metaTitle: Events and hooks - React Data Grid | Handsontable
searchCategory: Guides
category: Getting started
---

# Events and hooks

Run your code before or after specific data grid actions, using Handsontable's API hooks (callbacks). For example, control what happens with the user's input.

[[toc]]

## Overview

Callbacks are used to react before or after actions occur. We refer to them as hooks. Handsontable's hooks share some characteristics with events and middleware, combining them both in a unique structure.

## Events

If you only react to emitted hooks and forget about all their other features, you can treat Handsontable's hooks as pure events. You would want to limit your scope to `after` prefixed hooks, so they are emitted after something has happened and the results of the actions are already committed.

::: only-for react

```jsx
<HotTable afterCreateRow={(row, amount) => {
  console.log(`${amount} row(s) were created, starting at index ${row}`);
}}/>
```

:::

::: only-for javascript

```js
hot.addHook('afterCreateRow', (row, amount) => {
  console.log(`${amount} row(s) were created, starting at index ${row}`);
})
```

:::

## Middleware

Middleware is a concept known in the JavaScript world from Node.js frameworks such as Express or Koa. Middleware is a callback that can pipe to a process and allow the developer to modify it. We're no longer just reacting to an emitted event, but we can influence what's happening inside the component and modify the process.

::: only-for react

```jsx
<HotTable modifyColWidth={(width, column) => {
    if (column > 10) {
      return 150;
    }
}}/>
```

:::

::: only-for javascript

```js
hot.addHook('modifyColWidth', (width, column) => {
  if (column > 10) {
    return 150;
  }
})
```

:::

Note that the first argument is the current width that we're going to modify. Later arguments are immutable, and additional information can be used to decide whether the data should be modified.

## Handsontable hooks

We refer to all callbacks as "Handsontable hooks" because, although they share some characteristics with events and middleware, they combine them both in a unique structure. You may already be familiar with the concept as we're not the only ones that use the hooks convention.

Almost all `before`-prefixed Handsontable hooks let you return `false` and, therefore, block the execution of an action. It may be used for validation, rejecting operation by the outside service, or blocking our native algorithm and replace it with a custom implementation.

A great example for this is our integration with HyperFormula engine where creating a new row is only possible if the engine itself will allow it:

::: only-for react

```jsx
<HotTable
  beforeCreateRow={(row, amount) => {
    if (!hyperFormula.isItPossibleToAddRows(0, [row, amount])) {
      return false;
    }
}}/>
```

:::

::: only-for javascript

```js
hot.addHook('beforeCreateRow', (row, amount) => {
  if (!hyperFormula.isItPossibleToAddRows(0, [row, amount])) {
    return false;
  }
})
```

:::

The first argument may be modified and passed on through the Handsontable hooks that are next in the queue. This characteristic is shared between `before` and `after` hooks but is more common with the former. Before something happens, we can run the data through a pipeline of hooks that may modify or reject the operation. This provides many possibilities to extend the default Handsontable functionality and customize it for your application.

::: only-for react

## External control

::: example #example3 :react --js 1 --ts 2 --css 3

@[code](@/content/guides/getting-started/events-and-hooks/react/example3.jsx)
@[code](@/content/guides/getting-started/events-and-hooks/react/example3.tsx)
@[code](@/content/guides/getting-started/events-and-hooks/react/example3.css)

:::

:::

## All available Handsontable hooks example

Note that some callbacks are checked on this page by default.

::: example-without-tabs #example1

@[code](@/content/guides/getting-started/events-and-hooks/javascript/example1.html)
@[code](@/content/guides/getting-started/events-and-hooks/javascript/example1.css)
@[code](@/content/guides/getting-started/events-and-hooks/javascript/example1.js)

:::

## Definition for `source` argument

It's worth mentioning that some Handsontable hooks are triggered from the Handsontable core and some from the plugins. In some situations, it is helpful to know what triggered the callback. Did Handsontable trigger it, or was it triggered by external code or a user action? That's why in crucial hooks, Handsontable delivers `source` as an argument informing you who triggered the action and providing detailed information about the source. Using the information retrieved in the `source`, you can create additional conditions.

`source` argument is optional. It takes the following values:

| Value                                              | Description                                                                                                                                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto`                                             | Action triggered by Handsontable, and the reason for it is related directly to the settings applied to Handsontable. For example, [`afterCreateRow`](@/api/hooks.md#aftercreaterow) will be fired with this when [`minSpareRows`](@/api/options.md#minsparerows) will be greater than 0. |
| `edit`                                             | Action triggered by Handsontable after the data has been changed, e.g., after an edit or using `setData*` methods.                                                                                                     |
| `loadData`                                         | Action triggered by Handsontable after the [`loadData`](@/api/core.md#loaddata) method has been called with the [`data`](@/api/options.md#data) property.
| `updateData`                                         | Action triggered by Handsontable after the [`updateData`](@/api/core.md#updatedata) method has been called; e.g., before or after a data change.                                                                                                     |
| `populateFromArray`                                | Action triggered by Handsontable after requesting for populating data.                                                                                                                                                 |
| `spliceCol`                                        | Action triggered by Handsontable after the column data splicing has been done.                                                                                                                                         |
| `spliceRow`                                        | Action triggered by Handsontable after the row data splicing has been done.                                                                                                                                            |
| `timeValidate`                                     | Action triggered by Handsontable after the time validator has been called, e.g., after an edit.                                                                                                                        |
| `dateValidate`                                     | Action triggered by Handsontable after the date validator has been called, e.g., after an edit.                                                                                                                        |
| `validateCells`                                    | Action triggered by Handsontable after the validation process has been triggered.                                                                                                                                      |
| [`Autofill.fill`](@/api/autofill.md)               | Action triggered by the AutoFill plugin.                                                                                                                                                                               |
| [`ContextMenu.clearColumns`](@/api/contextMenu.md) | Action triggered by the ContextMenu plugin after the "Clear column" has been clicked.                                                                                                                                  |
| [`ContextMenu.columnLeft`](@/api/contextMenu.md)   | Action triggered by the ContextMenu plugin after the "Insert column left" has been clicked.                                                                                                                            |
| [`ContextMenu.columnRight`](@/api/contextMenu.md)  | Action triggered by the ContextMenu plugin after the "Insert column right" has been clicked.                                                                                                                           |
| [`ContextMenu.removeColumn`](@/api/contextMenu.md) | Action triggered by the ContextMenu plugin after the "Remove column" has been clicked.                                                                                                                                 |
| [`ContextMenu.removeRow`](@/api/contextMenu.md)    | Action triggered by the ContextMenu plugin after the "Remove Row" has been clicked.                                                                                                                                    |
| [`ContextMenu.rowAbove`](@/api/contextMenu.md)     | Action triggered by the ContextMenu plugin after the "Insert row above" has been clicked.                                                                                                                              |
| [`ContextMenu.rowBelow`](@/api/contextMenu.md)     | Action triggered by the ContextMenu plugin after the "Insert row below" has been clicked.                                                                                                                              |
| [`CopyPaste.paste`](@/api/copyPaste.md)            | Action triggered by the CopyPaste plugin after the value has been pasted.                                                                                                                                              |
| `MergeCells`                            | Action triggered by the MergeCells plugin when clearing the merged cells' underlying cells. |
| [`UndoRedo.redo`](@/api/undoRedo.md)               | Action triggered by the UndoRedo plugin after the change has been redone.                                                                                                                                              |
| [`UndoRedo.undo`](@/api/undoRedo.md)               | Action triggered by the UndoRedo plugin after the change has been undone.                                                                                                                                              |
| [`ColumnSummary.set`](@/api/columnSummary.md)      | Action triggered by the ColumnSummary plugin after the calculation has been done.                                                                                                                                      |
| [`ColumnSummary.reset`](@/api/columnSummary.md)    | Action triggered by the ColumnSummary plugin after the calculation has been reset.                                                                                                                                     |

List of callbacks that operate on the `source` parameter:

- [`afterChange`](@/api/hooks.md#afterchange)
- [`afterCreateCol`](@/api/hooks.md#aftercreatecol)
- [`afterCreateRow`](@/api/hooks.md#aftercreaterow)
- [`afterLoadData`](@/api/hooks.md#afterloaddata)
- [`afterSetDataAtCell`](@/api/hooks.md#aftersetdataatcell)
- [`afterSetDataAtRowProp`](@/api/hooks.md#aftersetdataatrowprop)
- [`afterSetSourceDataAtCell`](@/api/hooks.md#aftersetsourcedataatcell)
- [`afterRemoveCol`](@/api/hooks.md#afterremovecol)
- [`afterRemoveRow`](@/api/hooks.md#aftermoverow)
- [`afterValidate`](@/api/hooks.md#aftervalidate)
- [`beforeChange`](@/api/hooks.md#beforechange)
- [`beforeChangeRender`](@/api/hooks.md#beforechangerender)
- [`beforeCreateCol`](@/api/hooks.md#beforecreatecol)
- [`beforeCreateRow`](@/api/hooks.md#beforecreaterow)
- [`beforeLoadData`](@/api/hooks.md#beforeloaddata)
- [`beforeRemoveCol`](@/api/hooks.md#beforeremovecol)
- [`beforeRemoveRow`](@/api/hooks.md#beforeremoverow)
- [`beforeValidate`](@/api/hooks.md#beforevalidate)

## The [`beforeKeyDown`](@/api/hooks.md#beforekeydown) callback

The following demo uses [`beforeKeyDown`](@/api/hooks.md#beforekeydown) callback to modify some key bindings:

- Pressing <kbd>**Delete**</kbd> or <kbd>**Backspace**</kbd> on a cell deletes the cell and shifts all cells beneath it in the column up resulting in the cursor, which doesn't move, having the value previously beneath it, now in the current cell.
- Pressing <kbd>**Enter**</kbd> in a cell where the value remains unchanged pushes all the cells in the column beneath and including the current cell down one row. This results in a blank cell under the cursor which hasn't moved.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/getting-started/events-and-hooks/javascript/example2.js)
@[code](@/content/guides/getting-started/events-and-hooks/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/getting-started/events-and-hooks/react/example2.jsx)
@[code](@/content/guides/getting-started/events-and-hooks/react/example2.tsx)

:::

:::

## Related API reference

- Core methods:
  - [`addHook()`](@/api/core.md#addhook)
  - [`addHookOnce()`](@/api/core.md#addhookonce)
  - [`hasHook()`](@/api/core.md#hashook)
  - [`removeHook()`](@/api/core.md#removehook)
  - [`hasHook()`](@/api/core.md#hashook)
  - [`runHooks()`](@/api/core.md#runhooks)
- Hooks:
  - [List of all Handsontable hooks](@/api/hooks.md)
  - [`afterListen`](@/api/hooks.md#afterlisten)
  - [`afterUnlisten`](@/api/hooks.md#afterunlisten)

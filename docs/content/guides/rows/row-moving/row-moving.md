---
type: how-to
title: Row moving
metaTitle: Row moving - JavaScript Data Grid | Handsontable
description: Change the order of rows, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).
permalink: /row-moving
canonicalUrl: /row-moving
react:
  metaTitle: Row moving - React Data Grid | Handsontable
angular:
  metaTitle: Row moving - Angular Data Grid | Handsontable
vue:
  metaTitle: Row moving - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: updated
---
Change the order of rows, either manually (dragging them to another location), or programmatically (using Handsontable's API methods).

[[toc]]

## Enable the `ManualRowMove` plugin

To enable row moving, set the [`manualRowMove`](@/api/options.md#manualrowmove) option to `true`.

A draggable move handle appears above the selected row header. You can click and drag it to any location in the row header body.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-moving/javascript/example1.js)
@[code](@/content/guides/rows/row-moving/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-moving/react/example1.jsx)
@[code](@/content/guides/rows/row-moving/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-moving/angular/example1.ts)
@[code](@/content/guides/rows/row-moving/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-moving/vue/example1.vue)

:::

:::

## Set a pre-defined row order

Instead of setting [`manualRowMove`](@/api/options.md#manualrowmove) to `true`, you can pass an **array of physical row indexes** to define the initial visual order of rows on render.

Each position in the array corresponds to a visual (display) position, and the value at that position is the physical (source data) row index. For example:

```js
manualRowMove: [2, 0, 1]
```

This renders the rows in the following order:
- Visual position 0 → physical row `2`
- Visual position 1 → physical row `0`
- Visual position 2 → physical row `1`

The array must contain all physical row indexes (its length must equal the total number of rows). After the initial render, users can still drag rows to change the order further.

## Data model behavior

Moving rows does not reorder your source data array. Handsontable stores the new order as index metadata through its [`IndexMapper`](@/api/indexMapper.md), and leaves the original `sourceData` array untouched. This affects how you read and save the data:

- [`getData()`](@/api/core.md#getdata) returns rows in their current visual order, so it reflects any moves. Call it inside the [`afterRowMove`](@/api/hooks.md#afterrowmove) hook to get an order-accurate snapshot to persist.
- [`getSourceData()`](@/api/core.md#getsourcedata) returns rows in their original physical order, ignoring any moves.

To save the new order after a move, listen to the [`afterRowMove`](@/api/hooks.md#afterrowmove) hook:

```js
afterRowMove(movedRows, finalIndex, dropIndex, movePossible, orderChanged) {
  if (orderChanged) {
    const reorderedData = this.getData();

    // persist reorderedData to your backend
  }
}
```

### Don't feed the snapshot back into the grid

Sending the reordered snapshot back to the grid as its new data applies the move a second time. [`updateData()`](@/api/core.md#updatedata) keeps the current row order on purpose, so Handsontable re-applies the order map it already holds on top of your already-reordered array. One drag then moves the row twice.

Treat the snapshot as output only. Send it to your backend, and leave the grid's own data alone.

::: only-for javascript

To replace the data and reset the order together, call [`loadData()`](@/api/core.md#loaddata) instead. It clears the row order map along with the data, and it clears the undo history.

One exception: if you passed [`manualRowMove`](@/api/options.md#manualrowmove) as an array of indexes, the plugin re-applies that array right after the reset. You get the configured order back, not the source order.

:::

:::: only-for react angular vue

### Choose who owns the row order

The array you bind to [`data`](@/api/options.md#data) does not change when a user moves a row. The order lives in Handsontable's index map, not in your array. There are two ways to handle that, and you have to stay inside one of them:

- **Handsontable owns the order.** You bind the data once, and read the order out when you need it.
- **Your app owns the order.** You cancel each move, and reorder your own array instead.

Writing [`getData()`](@/api/core.md#getdata) back into the bound `data` mixes the two models. The grid still holds the order map for a move it has already made, so it applies that order on top of your already-reordered array. Your data and the grid end up out of sync, and the row can jump a second time.

#### Let Handsontable own the order

This is the default. Bind `data` once and leave it alone. Read the current order with [`getData()`](@/api/core.md#getdata) whenever you need to persist it.

To start the grid with a non-default order, pass the array through [`initialState`](@/api/options.md#initialstate) rather than [`manualRowMove`](@/api/options.md#manualrowmove). Handsontable reads [`initialState`](@/api/options.md#initialstate) only when it creates the grid, so a re-render can't apply the order a second time:

```js
initialState: {
  manualRowMove: [2, 0, 1],
},
```

The array both enables row moving and sets the starting order, so don't also pass [`manualRowMove`](@/api/options.md#manualrowmove) at the top level. A regular setting takes precedence over the same key in [`initialState`](@/api/options.md#initialstate), so `manualRowMove: true` alongside the code above would discard the order.

A `manualRowMove` array passed as a regular option can be re-applied on a later update, which reorders the rows again on top of the order they are already in. How often that happens depends on the framework, so don't rely on it not happening.

::: only-for react

For more on this, see [Non-idempotent options](@/guides/configuration/configuration-options/configuration-options.md#non-idempotent-options).

:::

#### Let your app own the order

Return `false` from [`beforeRowMove`](@/api/hooks.md#beforerowmove) to cancel Handsontable's move, then apply the same move to your own array. Handsontable keeps its rows in physical order, so your array is the only place the order is stored.

In this model you also own the order's history. Reverting a move is your code's job, not the grid's.

Cancelling the move changes what the grid does for you, so plan for these:

- [`afterRowMove`](@/api/hooks.md#afterrowmove) never fires. The move stops at [`beforeRowMove`](@/api/hooks.md#beforerowmove), before that hook runs, so the snapshot recipe shown earlier on this page does not apply here. Persist the order from your own update instead.
- The grid does not re-render or restore the selection, because both wait for a move that actually happened. After the drag, the highlighted row headers stay where they were, and those positions now hold different rows. Re-select the moved rows yourself if that matters.
- The hook reports visual row indexes, and the helper below uses them as positions in your array. Those match only while nothing else reorders or hides rows. Add [`columnSorting`](@/api/options.md#columnsorting), [`filters`](@/api/options.md#filters), or trimmed rows, and a visual index no longer points at the same row in your array, so you have to translate the indexes yourself. `finalIndex` is a visual index too.
- Cell metadata is keyed by the physical row. Reordering your own array moves the values but not the metadata, so per-row settings such as [`readOnly`](@/api/options.md#readonly), a cell `className`, or a comment stay on the position they were set on and end up on a different row.

This helper applies a move to a plain array. `movedRows` holds visual row indexes, and `finalIndex` is the index that the first moved row lands on:

```js
function reorderRows(rows, movedRows, finalIndex) {
  const result = rows.slice();
  const moved = movedRows.map(index => rows[index]);

  // remove from the highest index down, so the lower indexes stay valid
  movedRows
    .slice()
    .sort((a, b) => b - a)
    .forEach(index => result.splice(index, 1));

  result.splice(finalIndex, 0, ...moved);

  return result;
}
```

::: only-for react

Keep the rows in state, and write the new order back from the hook:

```jsx
const ExampleComponent = () => {
  const [rows, setRows] = useState(initialRows);

  return (
    <HotTable
      data={rows}
      manualRowMove={true}
      beforeRowMove={(movedRows, finalIndex, dropIndex, movePossible) => {
        if (!movePossible) {
          return;
        }

        setRows(prevRows => reorderRows(prevRows, movedRows, finalIndex));

        // cancel the grid's own move -- the state update above already applied it
        return false;
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};
```

:::

::: only-for angular

Keep the rows in a component property, and bind it through the `[data]` input.

The grid is created outside Angular's zone, so the hook also runs outside it. Assigning to a bound property there does not start change detection on its own, and the `[data]` input never sees the new array. Re-enter the zone to write the property, and defer it with `setTimeout` so a synchronous write inside the hook can't trigger `NG0100`:

```ts
@Component({
  selector: 'app-example',
  template: `<hot-table [settings]="hotSettings" [data]="rows"></hot-table>`,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {
  private readonly ngZone = inject(NgZone);

  rows = initialRows;

  readonly hotSettings: GridSettings = {
    manualRowMove: true,
    beforeRowMove: (movedRows, finalIndex, dropIndex, movePossible) => {
      if (!movePossible) {
        return;
      }

      setTimeout(() => {
        this.ngZone.run(() => {
          this.rows = reorderRows(this.rows, movedRows, finalIndex);
        });
      }, 0);

      // cancel the grid's own move -- the assignment above applies it instead
      return false;
    },
  };
}
```

:::

::: only-for vue

The Vue wrapper reads the bound array by reference, so change that array in place. Assigning a new array to `rows` leaves the grid rendering the old one:

```vue
<script setup>
const rows = reactive(initialRows);

const hotSettings = {
  manualRowMove: true,
  beforeRowMove(movedRows, finalIndex, dropIndex, movePossible) {
    if (!movePossible) {
      return;
    }

    // write the new order into the same array, so the grid sees it
    reorderRows(rows, movedRows, finalIndex).forEach((row, index) => {
      rows[index] = row;
    });

    // cancel the grid's own move -- the line above already applied it
    return false;
  },
};
</script>

<template>
  <HotTable :data="rows" :settings="hotSettings" />
</template>
```

:::

::::

For more on how physical and visual indexes relate, see [Understanding data and indexes](@/guides/getting-started/understanding-data-and-indexes/understanding-data-and-indexes.md).

## Result

After completing this guide, you can reorder rows by dragging them with the mouse or by calling `dragRows()` and `moveRows()` programmatically. You can also set a pre-defined row order at initialization.

## API reference

### dragRows vs moveRows

There are significant differences between the plugin's [`dragRows`](@/api/manualRowMove.md#dragrows) and [`moveRows`](@/api/manualRowMove.md#moverows) API functions. Both of them change the order of rows, but they rely on different kinds of indexes. The differences between them are shown in the diagrams below.

Both of these methods trigger the [`beforeRowMove`](@/api/hooks.md#beforerowmove) and [`afterRowMove`](@/api/hooks.md#afterrowmove) hooks, but only [`dragRows`](@/api/manualRowMove.md#dragrows) passes the `dropIndex` argument to them.

The [`dragRows`](@/api/manualRowMove.md#dragrows) method has a `dropIndex` parameter, which points to where the elements are being dropped.

<span class="img-invert">

![dragRows method](/img/drag_action.svg)

</span>


The [`moveRows`](@/api/manualRowMove.md#moverows) method has a `finalIndex` parameter, which points to where the elements will be placed after the _moving_ action - `finalIndex` being the index of the first moved element.

<span class="img-invert">

![moveRows method](/img/move_action.svg)

</span>

The [`moveRows`](@/api/manualRowMove.md#moverows) function cannot perform some actions, e.g., more than one element can't be moved to the last position. In this scenario, the move will be cancelled. The Plugin's [`isMovePossible`](@/api/manualRowMove.md#ismovepossible) API method and the `movePossible` parameters `beforeRowMove` and `afterRowMove` hooks help in determine such situations.

The [`moveRows`](@/api/manualRowMove.md#moverows) method is also inactive when the [`NestedRows`](@/api/nestedRows.md) plugin is enabled - see [Row parent-child known limitations](@/guides/rows/row-parent-child/row-parent-child.md#known-limitations).

### Related API reference

**Configuration options**

<div class="boxes-list">

- [manualRowMove](@/api/options.md#manualrowmove)

</div>

**Core methods**

<div class="boxes-list">

- [toVisualRow](@/api/core.md#tovisualrow)

</div>

**Hooks**

<div class="boxes-list">

- [afterRowMove](@/api/hooks.md#afterrowmove)
- [beforeRowMove](@/api/hooks.md#beforerowmove)

</div>

**Plugins**

<div class="boxes-list">

- [ManualRowMove](@/api/manualRowMove.md)

</div>

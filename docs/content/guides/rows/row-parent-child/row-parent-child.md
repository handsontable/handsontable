---
type: how-to
title: Row parent-child
metaTitle: Row parent-child - JavaScript Data Grid | Handsontable
description:
  Reflect the parent-child relationship of your data, using Handsontable's interactive UI elements such as expand and collapse buttons or an extended context
  menu.
permalink: /row-parent-child
canonicalUrl: /row-parent-child
tags:
  - nested rows
  - nestedRows
  - parent child
  - tree grid
  - grouping rows
  - master detail
react:
  metaTitle: Row parent-child - React Data Grid | Handsontable
angular:
  metaTitle: Row parent-child - Angular Data Grid | Handsontable
vue:
  metaTitle: Row parent-child - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: updated
---
Reflect the parent-child relationship of your data, using the [`NestedRows`](@/api/nestedRows.md) plugin's interactive UI elements such as expand and collapse
buttons or an extended context menu.

Handsontable renders this structure as a tree grid. The same pattern is also called a master-detail view or grouping rows.

[[toc]]

## Quick setup

To enable the [`NestedRows`](@/api/nestedRows.md) plugin, set the [`nestedRows`](@/api/options.md#nestedrows) option to `true`.

::: only-for javascript

```js
const hot = new Handsontable(container, {
  nestedRows: true,
});
```

:::

::: only-for react

```jsx
<HotTable nestedRows={true} />
```

:::

::: only-for angular

```ts
import {GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

const configurationOptions: GridSettings = {
  nestedRows: true,
};
```

```html
<hot-table [settings]="configurationOptions"></hot-table>
```

:::

::: only-for vue

```ts
const hotSettings = {
  nestedRows: true,
};
```

:::

Note that using all the functionalities provided by the plugin requires enabling the row headers and the Handsontable context menu. To do this set
[`rowHeaders`](@/api/options.md#rowheaders) and [`contextMenu`](@/api/options.md#contextmenu) to `true`. The _collapse_ / _expand_ buttons are located in the
row headers, and the row modification options _add row_, _insert child_, etc., are in the Context Menu.

## Prepare the data source

The data source must have a specific structure to be used with the _Nested Rows_ plugin.

The plugin requires the data source to be an array of objects. Each object in the array represents a single _0-level_ entry. _0-level_ refers to an entry, which
is not a child of any other entry. If an entry has any child entries, they need to be declared again as an _array of objects_. To assign them to a row, create a
`__children` property in the parent element. Child objects can define their own `__children` arrays, so you can nest rows to any depth. Handsontable does not
impose a fixed nesting limit -- the depth is determined by your data structure, and row header indentation grows with each level.

Here's an example:

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-parent-child/javascript/example1.js)
@[code](@/content/guides/rows/row-parent-child/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-parent-child/react/example1.jsx)
@[code](@/content/guides/rows/row-parent-child/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-parent-child/angular/example1.ts)
@[code](@/content/guides/rows/row-parent-child/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-parent-child/vue/example1.vue)

:::

:::

In the example above, we’ve created a data object consisting of 2016’s Grammy nominees of the “Rock” genre. Each _0-level_ entry declares a category. Under
`Best Rock Performance`, nominees are grouped into subcategories (`Major label releases` and `Independent releases`) at the next level, with individual nominees
nested one level deeper. The other categories use two levels: category and nominee, assigned under the `__children` properties.

Note that the first 0-level object in the array needs to have all columns defined to display the table properly. They can be declared as `null` or an empty
string `''`, but they need to be defined. This is optional for the other objects.

### Nested data vs. a flat array

A nested rows data source differs from a regular flat array of objects in one respect: child rows live inside their parent's `__children` property, instead of being separate top-level elements. For example, the same three records can be represented either way:

```js
// flat array -- three independent top-level rows
const flatData = [
  { category: 'Best Rock Performance', artist: null },
  { category: null, artist: 'Twenty One Pilots' },
  { category: null, artist: 'Coldplay' },
];

// nested rows -- two nominees grouped under one category
const nestedData = [
  {
    category: 'Best Rock Performance',
    artist: null,
    __children: [
      { category: null, artist: 'Twenty One Pilots' },
      { category: null, artist: 'Coldplay' },
    ],
  },
];
```

[`getSourceData()`](@/api/core.md#getsourcedata) returns this nested structure, `__children` arrays and all. [`getData()`](@/api/core.md#getdata) returns the flattened, currently visible rows -- collapsed child rows are excluded. For more on how Handsontable relates source data to what's displayed, see [Understanding data and indexes](@/guides/getting-started/understanding-data-and-indexes/understanding-data-and-indexes.md).

## User interface

The _Nested Rows_ plugin's user interface is placed in the row headers and the Handsontable’s context menu.

### Row headers

Each _parent_ row header contains a `+`/`-` button. It is used to collapse or expand its child rows.

The child row headers have a bigger indentation, to enable the user to clearly recognize the child and parent elements. In the example above, the
`Best Metal Performance` category loads collapsed so you can see the expand/collapse controls right away.

### Context Menu

The context menu has been extended with a few Nested Rows related options, such as:

- Insert child row
- Detach from parent

The “Insert row above” and “Insert row below” options were modified to work properly with the nested data structure.

## Result

After completing this guide, your grid displays rows in a parent-child hierarchy with collapse and expand toggle buttons in row headers and context menu options for inserting and detaching child rows.

## Collapse and expand rows from your code

The `NestedRows` plugin lets you collapse and expand parent rows from your own code, and tells you
when it happens.

### Methods

Get the plugin instance first, from your Handsontable instance:

```js
const plugin = hot.getPlugin('nestedRows');
```

| Method | What it does |
| --- | --- |
| [`collapseAll()`](@/api/nestedRows.md#collapseall) | Collapses every top-level parent |
| [`expandAll()`](@/api/nestedRows.md#expandall) | Expands every parent, at every level |
| [`collapseParent(row)`](@/api/nestedRows.md#collapseparent) | Collapses one parent |
| [`expandParent(row)`](@/api/nestedRows.md#expandparent) | Expands one parent |
| [`toggleParent(row)`](@/api/nestedRows.md#toggleparent) | Collapses an expanded parent, or expands a collapsed one |
| [`getCollapsedParents()`](@/api/nestedRows.md#getcollapsedparents) | Physical indexes of the collapsed parents |
| [`isParentCollapsed(row)`](@/api/nestedRows.md#isparentcollapsed) | Checks one parent |
| [`isParent(row)`](@/api/nestedRows.md#isparent) | Checks whether a row has children |
| [`getRowLevel(row)`](@/api/nestedRows.md#getrowlevel) | How deeply a row is nested. Top-level rows are at level `0` |
| [`getRowParent(row)`](@/api/nestedRows.md#getrowparent) | The parent of a row |
| [`countChildren(row)`](@/api/nestedRows.md#countchildren) | How many children a row has |
| [`expandToRow(row)`](@/api/nestedRows.md#expandtorow) | Expands every ancestor, to reveal a hidden row |
| [`expandToLevel(level)`](@/api/nestedRows.md#expandtolevel) | Shows rows down to a nesting level, and collapses everything deeper |

The example below calls four of them and prints what each one returns.

::: only-for javascript

::: example #example2 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/row-parent-child/javascript/example2.html)
@[code](@/content/guides/rows/row-parent-child/javascript/example2.js)
@[code](@/content/guides/rows/row-parent-child/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-parent-child/react/example2.jsx)
@[code](@/content/guides/rows/row-parent-child/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-parent-child/angular/example2.ts)
@[code](@/content/guides/rows/row-parent-child/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/rows/row-parent-child/vue/example2.vue)

:::

:::

### Which index type to pass

Collapsing a parent *trims* its children, which removes them from the grid. A trimmed row has no
visual index at all, so the plugin uses two index types:

- Methods that act on a row you can see take a **visual** row index. That covers
  `collapseParent()`, `expandParent()`, `toggleParent()`, `isParentCollapsed()`, `isParent()`,
  `getRowLevel()`, `getRowParent()`, and `countChildren()`.
- Methods that address a row the collapse itself hid take or return a **physical** row index. That
  covers `getCollapsedParents()` and `expandToRow()`.

Convert between the two with [`toVisualRow()`](@/api/core.md#tovisualrow) and
[`toPhysicalRow()`](@/api/core.md#tophysicalrow).

### Jump to a row inside a collapsed branch

This is where the two index types earn their keep. To reveal a row the user cannot see, you need
[`expandToRow()`](@/api/nestedRows.md#expandtorow), and you have to address that row by its
**physical** index — a hidden row has no visual index to pass.

The example starts fully collapsed. Each button looks up a task's physical row, expands whatever
ancestors are hiding it, then selects it. Notice how the physical row stays the same while the
visual row changes with whatever else is open.

::: only-for javascript

::: example #example3 --html 1 --js 2 --ts 3

@[code](@/content/guides/rows/row-parent-child/javascript/example3.html)
@[code](@/content/guides/rows/row-parent-child/javascript/example3.js)
@[code](@/content/guides/rows/row-parent-child/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-parent-child/react/example3.jsx)
@[code](@/content/guides/rows/row-parent-child/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-parent-child/angular/example3.ts)
@[code](@/content/guides/rows/row-parent-child/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/rows/row-parent-child/vue/example3.vue)

:::

:::

### Hooks

Four hooks report every collapse and expand, whether it came from the row header button, the
<kbd>**Enter**</kbd> shortcut, or one of the methods above:

- [`beforeRowCollapse`](@/api/hooks.md#beforerowcollapse) and
  [`afterRowCollapse`](@/api/hooks.md#afterrowcollapse)
- [`beforeRowExpand`](@/api/hooks.md#beforerowexpand) and
  [`afterRowExpand`](@/api/hooks.md#afterrowexpand)

They carry **physical** row indexes. Return `false` from either `before` hook to block the action:

```js
const configurationOptions = {
  // Stop the user from collapsing anything.
  beforeRowCollapse() {
    return false;
  },
};
```

One case fires no hooks: when [`updateData()`](@/api/core.md#updatedata) collapses the same parents
again on the new data. That is not a new action, only the state the user already chose, so it stays
silent. If you mirror the collapsed state somewhere, read it back with
[`getCollapsedParents()`](@/api/nestedRows.md#getcollapsedparents) after `updateData()` instead of
counting on a hook.

### Save and restore the collapsed rows

The two data methods treat the collapsed rows differently, and the difference decides whether you
have to restore anything at all:

- [`updateData()`](@/api/core.md#updatedata) **keeps** the collapsed parents. It matches them by
  their position in the tree, so they stay collapsed even when the number of children changes. Do
  not restore them yourself here. A saved list holds physical row indexes, and those move as soon as
  a parent gains or loses a child, so replaying it collapses the wrong rows.
- [`loadData()`](@/api/core.md#loaddata) **drops** them, along with every other row state.
  [`getCollapsedParents()`](@/api/nestedRows.md#getcollapsedparents) returns an empty array
  afterwards. Restore the state yourself if you want it back.

The example below covers the `loadData()` case. The hooks carry physical indexes, which is what you
want to store. Collapse the deepest parents first: collapsing a parent hides its children, so a
nested parent has to be collapsed while it is still visible.

```js
const plugin = hot.getPlugin('nestedRows');
let saved = [];

hot.addHook('afterRowCollapse', (currentCollapsedRows, destinationCollapsedRows) => {
  saved = destinationCollapsedRows;
});

hot.addHook('afterRowExpand', (currentCollapsedRows, destinationCollapsedRows) => {
  saved = destinationCollapsedRows;
});

// Later, after replacing the whole data set:
hot.loadData(nextDataSet);

hot.batchExecution(() => {
  [...saved]
    .sort((a, b) => (plugin.getRowLevel(hot.toVisualRow(b)) ?? 0) - (plugin.getRowLevel(hot.toVisualRow(a)) ?? 0))
    .forEach((physicalRow) => {
      const visualRow = hot.toVisualRow(physicalRow);

      if (visualRow !== null) {
        plugin.collapseParent(visualRow);
      }
    });
}, true);
```

## Notes

### Known limitations

When you use the parent-child row structure, the following Handsontable features are not supported:

- [Data source as an array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays)
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Manual row moving via `moveRows()`](@/api/manualRowMove.md#moverows) - use [`dragRows()`](@/api/manualRowMove.md#dragrows) instead

When the `NestedRows` plugin is enabled, the `ManualRowMove` plugin's [`moveRows()`](@/api/manualRowMove.md#moverows) method has no effect and logs a console warning. To move rows programmatically, use [`dragRows()`](@/api/manualRowMove.md#dragrows) instead.

### Keyboard shortcuts

This header-focused shortcut works only when a row header is focused. Enable [`navigableHeaders: true`](@/api/options.md#navigableheaders) to move focus onto headers with the arrow keys. For more details, see [Keyboard navigation](@/guides/accessibility/accessibility/accessibility.md#keyboard-navigation).

| Windows              | macOS                | Action                           |  Excel  | Sheets  |
| -------------------- | -------------------- | -------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd> | <kbd>**Enter**</kbd> | Collapse or expand the row group | &cross; | &cross; |

## Related articles

**Related guides**

<div class="boxes-list">

- [Row header](@/guides/rows/row-header/row-header.md)

</div>

**Configuration options**

<div class="boxes-list">

- [bindRowsWithHeaders](@/api/options.md#bindrowswithheaders)
- [contextMenu](@/api/options.md#contextmenu)
- [nestedRows](@/api/options.md#nestedrows)
- [rowHeaders](@/api/options.md#rowheaders)

</div>

**Core methods**

<div class="boxes-list">

- [getRowHeader()](@/api/core.md#getrowheader)
- [toPhysicalRow()](@/api/core.md#tophysicalrow)
- [toVisualRow()](@/api/core.md#tovisualrow)

</div>

**Plugin methods**

<div class="boxes-list">

- [collapseAll()](@/api/nestedRows.md#collapseall)
- [collapseParent()](@/api/nestedRows.md#collapseparent)
- [countChildren()](@/api/nestedRows.md#countchildren)
- [expandAll()](@/api/nestedRows.md#expandall)
- [expandParent()](@/api/nestedRows.md#expandparent)
- [expandToLevel()](@/api/nestedRows.md#expandtolevel)
- [expandToRow()](@/api/nestedRows.md#expandtorow)
- [getCollapsedParents()](@/api/nestedRows.md#getcollapsedparents)
- [getRowLevel()](@/api/nestedRows.md#getrowlevel)
- [getRowParent()](@/api/nestedRows.md#getrowparent)
- [isParent()](@/api/nestedRows.md#isparent)
- [isParentCollapsed()](@/api/nestedRows.md#isparentcollapsed)
- [toggleParent()](@/api/nestedRows.md#toggleparent)

</div>

**Hooks**

<div class="boxes-list">

- [afterAddChild](@/api/hooks.md#afteraddchild)
- [afterDetachChild](@/api/hooks.md#afterdetachchild)
- [afterRowCollapse](@/api/hooks.md#afterrowcollapse)
- [afterRowExpand](@/api/hooks.md#afterrowexpand)
- [beforeAddChild](@/api/hooks.md#beforeaddchild)
- [beforeDetachChild](@/api/hooks.md#beforedetachchild)
- [beforeRowCollapse](@/api/hooks.md#beforerowcollapse)
- [beforeRowExpand](@/api/hooks.md#beforerowexpand)

</div>

**Plugins**

<div class="boxes-list">

- [BindRowsWithHeaders](@/api/bindRowsWithHeaders.md)
- [ContextMenu](@/api/contextMenu.md)
- [NestedRows](@/api/nestedRows.md)

</div>

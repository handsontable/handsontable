---
type: how-to
title: Adding and removing columns
metaTitle: Adding and removing columns - JavaScript Data Grid | Handsontable
description: Insert and remove columns programmatically with the alter() method, through the context menu, or automatically with spare columns.
permalink: /column-adding
canonicalUrl: /column-adding
tags:
  - insert column
  - remove column
  - alter
  - add column
react:
  metaTitle: Adding and removing columns - React Data Grid | Handsontable
angular:
  metaTitle: Adding and removing columns - Angular Data Grid | Handsontable
vue:
  metaTitle: Adding and removing columns - Vue Data Grid | Handsontable
searchCategory: Guides
category: Columns
menuTag: new
---
Insert and remove columns programmatically with the [`alter()`](@/api/core.md#alter) method, through the context menu, or automatically with spare columns.

[[toc]]

## Insert and remove columns with the API

Call the [`alter()`](@/api/core.md#alter) method to change the column structure programmatically. Pass an action name, a column index, and the number of columns to insert or remove:

- `alter('insert_col_start', index, amount)` inserts columns to the left of the given column index.
- `alter('insert_col_end', index, amount)` inserts columns to the right of the given column index.
- `alter('remove_col', index, amount)` removes columns, starting at the given column index.

In the example below, **Insert column** appends a column to the right of the last column, and **Remove last column** removes the last column.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/columns/column-adding/javascript/example1.html)
@[code](@/content/guides/columns/column-adding/javascript/example1.js)
@[code](@/content/guides/columns/column-adding/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-adding/react/example1.jsx)
@[code](@/content/guides/columns/column-adding/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-adding/angular/example1.ts)
@[code](@/content/guides/columns/column-adding/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/columns/column-adding/vue/example1.vue)

:::

:::

The `index` argument uses visual column indexes. The `amount` argument defaults to `1` when omitted.

## Add and remove columns from the context menu

Enable the [`contextMenu`](@/api/options.md#contextmenu) option to let users insert and remove columns by right-clicking a column. The relevant menu items are `col_left` (**Insert column left**), `col_right` (**Insert column right**), and `remove_col` (**Remove column**).

Setting [`contextMenu`](@/api/options.md#contextmenu) to `true` shows the full default menu. To show only the column actions, pass an array of item keys, as in the example below. Right-click a column header or cell to open the menu.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-adding/javascript/example2.js)
@[code](@/content/guides/columns/column-adding/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-adding/react/example2.jsx)
@[code](@/content/guides/columns/column-adding/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-adding/angular/example2.ts)
@[code](@/content/guides/columns/column-adding/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/columns/column-adding/vue/example2.vue)

:::

:::

The [`allowInsertColumn`](@/api/options.md#allowinsertcolumn) and [`allowRemoveColumn`](@/api/options.md#allowremovecolumn) options control whether these context menu items are available. Both default to `true`. Set [`allowInsertColumn`](@/api/options.md#allowinsertcolumn) to `false` to hide the insert items, or [`allowRemoveColumn`](@/api/options.md#allowremovecolumn) to `false` to hide the remove item.

## Add spare columns automatically

Set the [`minSpareCols`](@/api/options.md#minsparecols) option to keep a number of empty columns at the end of the grid. When a user enters data in the last empty column, Handsontable adds another empty column, so the grid always has at least the configured number of spare columns.

```js
const configurationOptions = {
  // keep at least one empty column at the end of the grid
  minSpareCols: 1,
};
```

[`minSpareCols`](@/api/options.md#minsparecols) defaults to `0`.

## Control and react to column changes

Use Handsontable's hooks to validate or respond to column changes:

- [`beforeCreateCol`](@/api/hooks.md#beforecreatecol) runs before columns are inserted. Return `false` to cancel the insertion.
- [`afterCreateCol`](@/api/hooks.md#aftercreatecol) runs after columns are inserted.
- [`beforeRemoveCol`](@/api/hooks.md#beforeremovecol) runs before columns are removed. Return `false` to cancel the removal.
- [`afterRemoveCol`](@/api/hooks.md#afterremovecol) runs after columns are removed.

For example, block removing the last remaining column:

```js
const configurationOptions = {
  beforeRemoveCol(index, amount) {
    if (this.countCols() - amount < 1) {
      // cancel the removal
      return false;
    }
  },
};
```

## Result

After completing this guide, you can insert and remove columns with the [`alter()`](@/api/core.md#alter) method, let users add and remove columns through the context menu, keep spare columns at the end of the grid, and validate or react to column changes with hooks.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [allowInsertColumn](@/api/options.md#allowinsertcolumn)
- [allowRemoveColumn](@/api/options.md#allowremovecolumn)
- [contextMenu](@/api/options.md#contextmenu)
- [minSpareCols](@/api/options.md#minsparecols)

</div>

**Core methods**

<div class="boxes-list">

- [alter()](@/api/core.md#alter)
- [countCols()](@/api/core.md#countcols)

</div>

**Hooks**

<div class="boxes-list">

- [afterCreateCol](@/api/hooks.md#aftercreatecol)
- [afterRemoveCol](@/api/hooks.md#afterremovecol)
- [beforeCreateCol](@/api/hooks.md#beforecreatecol)
- [beforeRemoveCol](@/api/hooks.md#beforeremovecol)

</div>

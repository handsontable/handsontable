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

## Notes

### Known limitations

When you use the parent-child row structure, the following Handsontable features are not supported:

- [Data source as an array of arrays](@/guides/getting-started/binding-to-data/binding-to-data.md#array-of-arrays)
- [Column filter](@/guides/columns/column-filter/column-filter.md)
- [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md)
- [Manual row moving via `moveRows()`](@/api/manualRowMove.md#moverows) - use [`dragRows()`](@/api/manualRowMove.md#dragrows) instead

When the `NestedRows` plugin is enabled, the `ManualRowMove` plugin's [`moveRows()`](@/api/manualRowMove.md#moverows) method has no effect and logs a console warning. To move rows programmatically, use [`dragRows()`](@/api/manualRowMove.md#dragrows) instead.

### Keyboard shortcuts

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

</div>

**Hooks**

<div class="boxes-list">

- [afterAddChild](@/api/hooks.md#afteraddchild)
- [afterDetachChild](@/api/hooks.md#afterdetachchild)
- [beforeAddChild](@/api/hooks.md#beforeaddchild)
- [beforeDetachChild](@/api/hooks.md#beforedetachchild)

</div>

**Plugins**

<div class="boxes-list">

- [BindRowsWithHeaders](@/api/bindRowsWithHeaders.md)
- [ContextMenu](@/api/contextMenu.md)
- [NestedRows](@/api/nestedRows.md)

</div>

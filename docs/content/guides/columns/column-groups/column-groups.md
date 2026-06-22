---
type: how-to
title: Column groups
metaTitle: Column groups - JavaScript Data Grid | Handsontable
description: Group your columns, using multiple levels of nested column headers, to better reflect the structure of your data.
permalink: /column-groups
canonicalUrl: /column-groups
tags:
  - nested headers
  - nestedHeaders
  - collapsing columns
  - colspan
  - rowspan
react:
  metaTitle: Column groups - React Data Grid | Handsontable
angular:
  metaTitle: Column groups - Angular Data Grid | Handsontable
vue:
  metaTitle: Column groups - Vue Data Grid | Handsontable
searchCategory: Guides
category: Columns
menuTag: updated
---
Group your columns, using multiple levels of nested column headers, to better reflect the structure of your data.

[[toc]]

## Nested column headers

The [`NestedHeaders`](@/api/nestedHeaders.md) plugin allows you to create a nested headers structure by using the HTML `colspan` and `rowspan` attributes.

To create a header that spans multiple columns, its corresponding configuration array element should be provided as an object with `label` and `colspan`
properties. The `label` property defines the header's label, while the `colspan` property defines the number of columns that the header should cover.

To create a header that spans multiple header rows, add a `rowspan` property to that object. See [Rowspan](#rowspan) below.

### Configuration

::: only-for javascript

```js
nestedHeaders: [
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
];
```

:::

::: only-for react

```jsx
nestedHeaders={[
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
]}
```

:::

::: only-for vue

```js
nestedHeaders: [
  ['A', { label: 'B', colspan: 8 }, 'C'],
  ['D', { label: 'E', colspan: 4 }, { label: 'F', colspan: 4 }, 'G'],
  ['H', { label: 'I', colspan: 2 }, { label: 'J', colspan: 2 }, { label: 'K', colspan: 2 }, { label: 'L', colspan: 2 }, 'M'],
  ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'],
],
```

:::

### Example

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/javascript/example1.js)
@[code](@/content/guides/columns/column-groups/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/react/example1.jsx)
@[code](@/content/guides/columns/column-groups/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-groups/angular/example1.ts)
@[code](@/content/guides/columns/column-groups/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/columns/column-groups/vue/example1.vue)

:::

:::

### Rowspan

The `rowspan` property sets how many header rows a single header cell should cover. Use an integer greater than `1`. Positions in lower rows that sit under that cell can use an empty string `''` as a placeholder, but those placeholders are optional. Handsontable can infer covered slots when you omit them.

You can combine `rowspan` and `colspan` on the same header object. The same rules apply as for colspan only: a header cannot be wider than its parent in the hierarchy, and overlapping header definitions are not supported.

#### Configuration

::: only-for javascript

```js
nestedHeaders: [
  [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
  ['', 'C', 'D'],
];
```

:::

::: only-for react

```jsx
nestedHeaders={[
  [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
  ['', 'C', 'D'],
]}
```

:::

::: only-for angular

```ts
nestedHeaders: [
  [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
  ['', 'C', 'D'],
];
```

:::

::: only-for vue

```js
nestedHeaders: [
  [{ label: 'A', rowspan: 2 }, { label: 'B', colspan: 2 }],
  ['', 'C', 'D'],
],
```

:::

## Collapsible headers

The [`CollapsibleColumns`](@/api/collapsibleColumns.md) plugin enables columns and their headers to be collapsed/expanded.

This plugin adds multi-column headers which have buttons. Clicking these buttons will collapse or expand all "child" headers, leaving the first one visible.

The [`NestedHeaders`](@/api/nestedHeaders.md) plugin needs to be enabled for this to work properly.

### Configuration

To enable the Collapsible Columns plugin, either set the [`collapsibleColumns`](@/api/options.md#collapsiblecolumns) configuration option to:

- `true` - this will enable the functionality for _all_ multi-column headers, every column with the `colspan` attribute defined will be extended with the
  "expand/collapse" button
- An array of objects containing information specifying which headers should have the "expand/collapse" buttons for example:

::: only-for javascript

```js
collapsibleColumns: [
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true }, // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
];
```

:::

::: only-for react

```jsx
collapsibleColumns={[
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true } // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
]}
```

:::

::: only-for angular

```js
collapsibleColumns: [
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true }, // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
];
```

:::

::: only-for vue

```js
collapsibleColumns: [
  { row: -4, col: 1, collapsible: true }, // Add the button to the 4th-level header of the 1st column - counting from the first table row upwards.
  { row: -3, col: 5, collapsible: true }, // Add the button to the 3rd-level header of the 5th column - counting from the first table row upwards.
],
```

:::

### Example

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/javascript/example2.js)
@[code](@/content/guides/columns/column-groups/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/react/example2.jsx)
@[code](@/content/guides/columns/column-groups/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-groups/angular/example2.ts)
@[code](@/content/guides/columns/column-groups/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/columns/column-groups/vue/example2.vue)

:::

:::

### Choose which columns stay visible when collapsed

By default, collapsing a group leaves its first column visible. To choose which columns stay visible in each state, add the `visibleWhen` property to a header in the `nestedHeaders` configuration. It accepts three values:

- `'collapsed'` - the column is visible only while its group is collapsed (hidden while expanded).
- `'expanded'` - the column is visible only while its group is expanded (hidden while collapsed).
- `'always'` - the column is visible in both states.

Once a group uses `visibleWhen` on any of its headers, the headers you leave unmarked default to `'expanded'` - they are hidden when the group collapses. So you only mark the column(s) you want to keep: tag one with `'always'` (stays in both states) or `'collapsed'` (a summary column that appears only on collapse). At least one column of a group always stays visible, so its collapse button is never lost.

In the example below, collapse the **Q1 2025** group: the per-month columns (marked `'expanded'`) hide and the **Total** column (`'collapsed'`) appears. Expanding the group reverses it.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/javascript/example3.js)
@[code](@/content/guides/columns/column-groups/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/react/example3.jsx)
@[code](@/content/guides/columns/column-groups/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-groups/angular/example3.ts)
@[code](@/content/guides/columns/column-groups/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/columns/column-groups/vue/example3.vue)

:::

:::

A group whose headers use no `visibleWhen` markers keeps the default behavior - collapsing leaves its first column visible. The `visibleWhen` property applies only to headers within a [`collapsible`](@/api/options.md#collapsiblecolumns) group.

## Moving grouped columns

When you enable the [`ManualColumnMove`](@/api/manualColumnMove.md) plugin, nested column headers follow their columns. Moving a column moves both its data and its header label, so the labels always describe the columns beneath them.

When a move separates the columns of a group, that group renders as more than one header. Each header covers a contiguous run of the group's columns and repeats the group's label. No move is blocked.

Moving an entire group relocates the group and its label as a single unit. The group can land between other groups.

When a group is both [collapsible](#collapsible-headers) and collapsed:

- A move that keeps the group's columns together keeps the group collapsed and moves it to its new position.
- A move that would separate the group's columns expands the group first, so none of its columns stay hidden without a way to expand them.

### Keep a group cohesive or let it split

By default, a group is _cohesive_. When you move a column into the group's span, the group adopts that column as a member and stays a single header that grows to cover it.

Set `splittable: true` on the group's header object to change this. A splittable group never adopts a moved-in column. It keeps its identity and renders as several same-label banners around the inserted column.

`splittable` affects only a move _into_ a group. Moving a column _out of_ a group separates both cohesive and splittable groups the same way: the group renders as more than one header, each repeating its label.

::: only-for javascript

```js
nestedHeaders: [
  // "Q1 2025" is cohesive (the default); "Q2 2025" splits when a column moves into it.
  [{ label: 'Q1 2025', colspan: 3 }, { label: 'Q2 2025', colspan: 3, splittable: true }],
  ['January', 'February', 'March', 'April', 'May', 'June'],
];
```

:::

::: only-for react

```jsx
nestedHeaders={[
  // "Q1 2025" is cohesive (the default); "Q2 2025" splits when a column moves into it.
  [{ label: 'Q1 2025', colspan: 3 }, { label: 'Q2 2025', colspan: 3, splittable: true }],
  ['January', 'February', 'March', 'April', 'May', 'June']
]}
```

:::

::: only-for angular

```ts
nestedHeaders: [
  // "Q1 2025" is cohesive (the default); "Q2 2025" splits when a column moves into it.
  [{ label: 'Q1 2025', colspan: 3 }, { label: 'Q2 2025', colspan: 3, splittable: true }],
  ['January', 'February', 'March', 'April', 'May', 'June'],
];
```

:::

::: only-for vue

```js
nestedHeaders: [
  // "Q1 2025" is cohesive (the default); "Q2 2025" splits when a column moves into it.
  [{ label: 'Q1 2025', colspan: 3 }, { label: 'Q2 2025', colspan: 3, splittable: true }],
  ['January', 'February', 'March', 'April', 'May', 'June'],
],
```

:::

In the example below, both quarters group three months. **Q1 2025** is cohesive and **Q2 2025** is splittable. Drag a month from **Q2 2025** into the middle of **Q1 2025**: the **Q1 2025** group adopts it and spans four columns. Drag a month from **Q1 2025** into the middle of **Q2 2025**: the **Q2 2025** group splits into two **Q2 2025** banners around the inserted column.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/javascript/example4.js)
@[code](@/content/guides/columns/column-groups/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/columns/column-groups/react/example4.jsx)
@[code](@/content/guides/columns/column-groups/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/columns/column-groups/angular/example4.ts)
@[code](@/content/guides/columns/column-groups/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/columns/column-groups/vue/example4.vue)

:::

:::

## Known limitations

- A column header can span up to 1000 columns, as the [HTML table specification](https://html.spec.whatwg.org/multipage/tables.html#dom-tdth-colspan) sets the
  limit of `colspan` to `1000`.
- A nested column header can't be wider than its parent element (headers can't overlap).
- If `rowspan` is larger than the number of header rows below the cell, Handsontable clamps it to the remaining header levels.

## Related keyboard shortcuts

| Windows                                     | macOS                                        | Action                                                  |  Excel  | Sheets  |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd>                        | <kbd>**Enter**</kbd>                         | Collapse or expand the selected column group            | &cross; | &cross; |

## Related API reference

**Configuration options**

<div class="boxes-list">

- [collapsibleColumns](@/api/options.md#collapsiblecolumns)
- [nestedHeaders](@/api/options.md#nestedheaders)
- [manualColumnMove](@/api/options.md#manualcolumnmove)

</div>

**Core methods**

<div class="boxes-list">

- [isColumnModificationAllowed()](@/api/core.md#iscolumnmodificationallowed)

</div>

**Hooks**

<div class="boxes-list">

- [afterColumnCollapse](@/api/hooks.md#aftercolumncollapse)
- [afterColumnExpand](@/api/hooks.md#aftercolumnexpand)
- [beforeColumnCollapse](@/api/hooks.md#beforecolumncollapse)
- [beforeColumnExpand](@/api/hooks.md#beforecolumnexpand)

</div>

**Plugins**

<div class="boxes-list">

- [CollapsibleColumns](@/api/collapsibleColumns.md)
- [NestedHeaders](@/api/nestedHeaders.md)

</div>

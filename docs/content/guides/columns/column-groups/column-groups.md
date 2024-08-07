---
id: k4mb003v
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
react:
  id: 2ei1omu0
  metaTitle: Column groups - React Data Grid | Handsontable
searchCategory: Guides
category: Columns
---

# Column groups

Group your columns, using multiple levels of nested column headers, to better reflect the structure of your data.

[[toc]]

## Nested column headers

The [`NestedHeaders`](@/api/nestedHeaders.md) plugin allows you to create a nested headers structure by using the `colspan` attribute.

To create a header that spans multiple columns, its corresponding configuration array element should be provided as an object with `label` and `colspan`
properties. The `label` property defines the header's label, while the `colspan` property defines the number of columns that the header should cover.

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

## Known limitations

- A column header can span up to 1000 columns, as the [HTML table specification](https://html.spec.whatwg.org/multipage/tables.html#dom-tdth-colspan) sets the
  limit of `colspan` to `1000`.
- A nested column header can't be wider than its parent element (headers can't overlap).

## Related keyboard shortcuts

| Windows                                     | macOS                                        | Action                                                  |  Excel  | Sheets  |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- | :-----: | :-----: |
| <kbd>**Enter**</kbd>                        | <kbd>**Enter**</kbd>                         | Collapse or expand the selected column group            | &cross; | &cross; |

## Related API reference

- Configuration options:
  - [`collapsibleColumns`](@/api/options.md#collapsiblecolumns)
  - [`nestedHeaders`](@/api/options.md#nestedheaders)
- Core methods:
  - [`isColumnModificationAllowed()`](@/api/core.md#iscolumnmodificationallowed)
- Hooks:
  - [`afterColumnCollapse`](@/api/hooks.md#aftercolumncollapse)
  - [`afterColumnExpand`](@/api/hooks.md#aftercolumnexpand)
  - [`beforeColumnCollapse`](@/api/hooks.md#beforecolumncollapse)
  - [`beforeColumnExpand`](@/api/hooks.md#beforecolumnexpand)
- Plugins:
  - [`CollapsibleColumns`](@/api/collapsibleColumns.md)
  - [`NestedHeaders`](@/api/nestedHeaders.md)

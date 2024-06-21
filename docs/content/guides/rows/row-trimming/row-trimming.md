---
id: 4q2wi29j
title: Row trimming
metaTitle: Row trimming - JavaScript Data Grid | Handsontable
description: Hide individual rows from your interface and exclude them from the rendering process and DataMap. This feature is similar, but not the same, as "hiding rows".
permalink: /row-trimming
canonicalUrl: /row-trimming
react:
  id: fkcjw0q1
  metaTitle: Row trimming - React Data Grid | Handsontable
searchCategory: Guides
category: Rows
---

# Row trimming

Hide individual rows from your interface and exclude them from the rendering process and `DataMap`.

[[toc]]

## Overview

Row trimming is similar to [row hiding](@/guides/rows/row-hiding/row-hiding.md), but works a bit differently.

The [`TrimRows`](@/api/trimRows.md) plugin allows the trimming of specific rows from the table. Rows being trimmed aren't rendered and aren't included in the `DataMap`, which can be retrieved by calling the [`getData`](@/api/core.md#getdata) method.

## Setup

To enable row trimming, set the [`trimRows`](@/api/options.md#trimrows) option to `true`.

::: only-for javascript

```js
// enable the `TrimRows` plugin
trimRows: true,
```

:::

::: only-for react

```jsx
// enable the `TrimRows` plugin

<HotTable
  trimRows={true}
/>
```

:::

To both enable row trimming and trim selected rows at Handsontable's initialization, set the [`trimRows`](@/api/options.md#trimrows) option to an array of physical row indexes.

::: only-for javascript

```js
// enable the `TrimRows` plugin
// at Handsontable's initialization, trim rows 5, 10, and 15
trimRows: [5, 10, 15],
```

:::

::: only-for react

```jsx
// enable the `TrimRows` plugin
// at Handsontable's initialization, trim rows 5, 10, and 15

<HotTable
  trimRows={[5, 10, 15]}
/>
```

:::

## Example

Note that the second, third, and sixth rows are missing in the following example:

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-trimming/javascript/example1.js)
@[code](@/content/guides/rows/row-trimming/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-trimming/react/example1.jsx)
@[code](@/content/guides/rows/row-trimming/react/example1.tsx)

:::

:::

## API examples

::: only-for react

::: tip

To use the Handsontable API, you'll need access to the Handsontable instance. You can do that by utilizing a reference to the `HotTable` component, and reading its `hotIntance` property.

For more information, see the [Instance methods](@/guides/getting-started/react-methods/react-methods.md) page.

:::

:::

The plugin instance can be accessed by calling:

```js
const plugin = hot.getPlugin('trimRows');
```

To trim a single row, call the [`trimRow()`](@/api/trimRows.md#trimrow) method of the plugin object:

```js
plugin.trimRow(4);
```
To trim multiple rows, either pass them as arguments to the [`trimRow()`](@/api/trimRows.md#trimrow) method, or pass an array of physical row indexes to the [`trimRows()`](@/api/trimRows.md#trimrows) method:

```js
plugin.trimRow(0, 4, 6);
// or
plugin.trimRows([0, 4, 6]);
```

To restore the trimmed row(s), use the following methods:

```js
plugin.untrimRow(4);
```
```js
plugin.untrimRow(0, 4, 6);
```
```js
plugin.untrimRows([0, 4, 6]);
```

To see the changes made, call `hot.render();` to re-render the table.

## Related API reference

- Options:
  - [`trimRows`](@/api/options.md#trimrows)
- Hooks:
  - [`afterTrimRow`](@/api/hooks.md#aftertrimrow)
  - [`afterUntrimRow`](@/api/hooks.md#afteruntrimrow)
  - [`beforeTrimRow`](@/api/hooks.md#beforetrimrow)
  - [`beforeUntrimRow`](@/api/hooks.md#beforeuntrimrow)
- Plugins:
  - [`TrimRows`](@/api/trimRows.md)

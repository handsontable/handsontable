---
type: how-to
title: Row headers
metaTitle: Row headers - JavaScript Data Grid | Handsontable
description: Use default row headers (1, 2, 3), or set them to custom values provided by an array or a function.
permalink: /row-header
canonicalUrl: /row-header
tags:
  - custom headers
  - bind rows with headers
  - row id
react:
  metaTitle: Row headers - React Data Grid | Handsontable
angular:
  metaTitle: Row headers - Angular Data Grid | Handsontable
vue:
  metaTitle: Row headers - Vue Data Grid | Handsontable
searchCategory: Guides
category: Rows
menuTag: updated
---
Use default row headers (1, 2, 3), or set them to custom values provided by an array or a function.

[[toc]]

## Overview

Row headers are gray-colored columns that are used to label each row. By default, these headers are filled with numbers displayed in ascending order.

To turn the headers on, set the option [`rowHeaders`](@/api/options.md#rowheaders) to `true`.

## Row headers as an array

An array of labels can be used to set the [`rowHeaders`](@/api/options.md#rowheaders) as shown in the example below:

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/rows/row-header/javascript/example2.js)
@[code](@/content/guides/rows/row-header/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-header/react/example2.jsx)
@[code](@/content/guides/rows/row-header/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-header/angular/example2.ts)
@[code](@/content/guides/rows/row-header/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/rows/row-header/vue/example2.vue)

:::

:::

## Row headers as a function

The [`rowHeaders`](@/api/options.md#rowheaders) can also be populated using a function as shown in the example below:

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/rows/row-header/javascript/example3.js)
@[code](@/content/guides/rows/row-header/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-header/react/example3.jsx)
@[code](@/content/guides/rows/row-header/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-header/angular/example3.ts)
@[code](@/content/guides/rows/row-header/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/rows/row-header/vue/example3.vue)

:::

:::

## Row header width

Row headers have a fixed width. When you use custom row labels, a label longer than that width is
clipped, and the header does not grow to fit it the way a column does.

You have two ways to deal with this: set the width yourself, or let Handsontable measure it.

### Set the width yourself

To control the header size, set [`rowHeaderWidth`](@/api/options.md#rowheaderwidth) to one of the following:

- A number - set the same width for every row header.
- An array - set different widths for individual row header levels.

The [Row headers as an array](#row-headers-as-an-array) example uses custom labels together with `rowHeaderWidth: 80`.

### Size the header to its content

To size the row header column to its longest label, enable the
[`AutoRowHeaderSize`](@/api/autoRowHeaderSize.md) plugin by setting
[`autoRowHeaderSize`](@/api/options.md#autorowheadersize) to `true`. That is all you need: the plugin
takes the header's width over, so any `rowHeaderWidth` you already set is ignored while it is enabled.

In the example below, the row labels are too long for the default header width. Turning the plugin on
is enough to make every label fit.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/rows/row-header/javascript/example4.js)
@[code](@/content/guides/rows/row-header/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-header/react/example4.jsx)
@[code](@/content/guides/rows/row-header/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-header/angular/example4.ts)
@[code](@/content/guides/rows/row-header/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/rows/row-header/vue/example4.vue)

:::

:::

The plugin is off by default, for two reasons. It reads every row header once to find the longest
label, so that first pass costs more as the number of rows grows. And turning it on would change the
row header width of every grid that uses custom labels. This mirrors
[`AutoRowSize`](@/api/autoRowSize.md), which is also opt-in, while
[`AutoColumnSize`](@/api/autoColumnSize.md) - bounded by the number of columns - is on by default.

The plugin never makes a header narrower than the default width, so a grid of short labels looks the
same as it does without the plugin.

#### Tuning the measurement

Instead of `true`, you can pass an object to change how the measurement runs. Both properties are
optional, and the defaults suit most grids:

| Property                | Possible values   | Description                                                                                      |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `samplingRatio`         | A number          | How many labels of the same length get rendered and measured. Default: `3`.                      |
| `allowSampleDuplicates` | `true` \| `false` | Whether two rows carrying the same label are both measured. Default: `false`.                    |

```js
autoRowHeaderSize: {
  samplingRatio: 5,
  allowSampleDuplicates: true,
},
```

**`samplingRatio`** exists because reading a label is cheap but laying one out is not. The plugin
groups the labels by how many characters they have and renders only a few from each group. Raising
the number measures more of them, which is slightly slower but harder to fool: in a proportional
font `WWW` is wider than `iii`, so measuring more same-length labels makes it less likely that the
widest one is missed. Lower it to do less work.

**`allowSampleDuplicates`** decides what happens when two rows carry the same label. By default the
label is measured once, because the same text normally renders to the same width. Set it to `true`
when that is not true of your grid — a row header that is indented per row, as
[`nestedRows`](@/api/options.md#nestedrows) does, draws the same label at a different width
depending on how deep the row sits, so measuring only the first one would come out too narrow.

Setting `autoRowHeaderSize` to `false`, or leaving it out, keeps the fixed-width headers.

### Add more row header columns

A grid can render more than one row header. The
[`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers) hook hands you the array of
renderers that draw them, one renderer per column. Push your own renderer onto that array, and it
draws one more row header column to the right of the previous one.

The example below pushes two renderers next to the default numbering, so the grid gets three row
header columns. Each column holds labels of a different length, and `autoRowHeaderSize` measures
every column on its own: the numbering column stays narrow, while each label column gets the width
its own text needs. Turn the plugin off and all three columns fall back to the same fixed width,
which clips the longer labels.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/rows/row-header/javascript/example5.js)
@[code](@/content/guides/rows/row-header/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-header/react/example5.jsx)
@[code](@/content/guides/rows/row-header/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-header/angular/example5.ts)
@[code](@/content/guides/rows/row-header/angular/example5.html)

:::

:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/rows/row-header/vue/example5.vue)

:::

:::

Each renderer is called with the row's renderable index - the index Handsontable renders by. It is
the same as the [visual index](@/guides/getting-started/understanding-data-and-indexes/understanding-data-and-indexes.md)
until rows are hidden or trimmed. If your grid hides rows, translate the index with
[`getVisualFromRenderableIndex()`](@/api/indexMapper.md#getvisualfromrenderableindex) before you look
a label up by it.

## Bind rows with headers

You can bind row numbers with row headers. This is used mostly to differentiate two business cases in which Handsontable is most often used.

1. When moving a row in a typical grid-like application, the numbers in the row headers remain intact. Only the content is moved.

2. In a data grid, each row has its unique ID. Therefore, the column header should follow its row whenever it changes its position in the grid.

### Basic example

To enable the plugin, set the [`bindRowsWithHeaders`](@/api/options.md#bindrowswithheaders) property to `true`. Move the rows in the example below to see what this plugin does.

Possible values:

- `true` - Enables the plugin.
- `strict` - Enables the plugin and the order of indexes is not reorganized after the operation such as hiding or moving rows.
- `loose` -  Enables the plugin and the order of indexes is re-organized after the operation such as hiding or moving rows.


::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/rows/row-header/javascript/example1.js)
@[code](@/content/guides/rows/row-header/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/rows/row-header/react/example1.jsx)
@[code](@/content/guides/rows/row-header/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/rows/row-header/angular/example1.ts)
@[code](@/content/guides/rows/row-header/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/rows/row-header/vue/example1.vue)

:::

:::

## Tree grid

A tree grid enables you to represent the nested data structures within the data grid. To learn more about this feature, see the [Row parent-child](@/guides/rows/row-parent-child/row-parent-child.md) page.

## Related articles

**Related guides**

<div class="boxes-list">

- [Row parent-child](@/guides/rows/row-parent-child/row-parent-child.md)

</div>

**Configuration options**

<div class="boxes-list">

- [activeHeaderClassName](@/api/options.md#activeheaderclassname)
- [autoRowHeaderSize](@/api/options.md#autorowheadersize)
- [currentHeaderClassName](@/api/options.md#currentheaderclassname)
- [bindRowsWithHeaders](@/api/options.md#bindrowswithheaders)
- [rowHeaders](@/api/options.md#rowheaders)
- [rowHeaderWidth](@/api/options.md#rowheaderwidth)

</div>

**Core methods**

<div class="boxes-list">

- [getRowHeader()](@/api/core.md#getrowheader)
- [hasRowHeaders()](@/api/core.md#hasrowheaders)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetRowHeader](@/api/hooks.md#aftergetrowheader)
- [afterGetRowHeaderRenderers](@/api/hooks.md#aftergetrowheaderrenderers)
- [beforeHighlightingRowHeader](@/api/hooks.md#beforehighlightingrowheader)
- [modifyRowHeader](@/api/hooks.md#modifyrowheader)
- [modifyRowHeaderWidth](@/api/hooks.md#modifyrowheaderwidth)

</div>

**Plugins**

<div class="boxes-list">

- [AutoRowHeaderSize](@/api/autoRowHeaderSize.md)
- [BindRowsWithHeaders](@/api/bindRowsWithHeaders.md)

</div>

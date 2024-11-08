---
id: k41dcpud
title: Disabled cells
metaTitle: Disabled cells - JavaScript Data Grid | Handsontable
description: Make specified cells read-only to protect them from unwanted changes but still allow navigation and copying of data.
permalink: /disabled-cells
canonicalUrl: /disabled-cells
tags:
  - read-only
  - readonly
  - non-editable
  - noneditable
  - locked
react:
  id: zhv7fs29
  metaTitle: Disabled cells - React Data Grid | Handsontable
searchCategory: Guides
category: Cell features
---

# Disabled cells

Make specified cells read-only to protect them from unwanted changes but still allow navigation and copying of data.

[[toc]]

## Overview

Disabling a cell makes the cell read-only or non-editable. Both have similar outcomes, with the following differences:

| Read-only cell<br>`readOnly: true`                                           | Non-editable cell<br>`editor: false`                                       |
|------------------------------------------------------------------------------| -------------------------------------------------------------------------- |
| Has an additional CSS class (`htDimmed`)                                     | Has no additional CSS class                                                |
| Copy works, paste doesn't work                                               | Copy-paste works                                                           |
| Drag-to-fill doesn't work                                                    | Drag-to-fill works                                                         |
| Can't be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) | Can be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) |

## Read-only grid

You can make the entire grid read-only by setting [`readOnly`](@/api/options.md#readonly) to `true` as a [top-level grid option](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

::: only-for javascript

::: example #exampleReadOnlyGrid --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/javascript/exampleReadOnlyGrid.js)
@[code](@/content/guides/cell-features/disabled-cells/javascript/exampleReadOnlyGrid.ts)

:::

:::

::: only-for react

::: example #exampleReadOnlyGrid :react --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/react/exampleReadOnlyGrid.jsx)
@[code](@/content/guides/cell-features/disabled-cells/react/exampleReadOnlyGrid.tsx)

:::

:::

## Read-only columns

In many use cases, you will need to configure a certain column to be read-only. This column will be available for keyboard navigation and copying data (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>). Editing and pasting data will be disabled.

To make a column read-only, declare it in the [`columns`](@/api/options.md#columns) configuration option. You can also define a special renderer function that will dim the read-only values, providing a visual cue for the user that the cells are read-only.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/javascript/example1.js)
@[code](@/content/guides/cell-features/disabled-cells/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/react/example1.jsx)
@[code](@/content/guides/cell-features/disabled-cells/react/example1.tsx)

:::

:::

## Read-only specific cells

This example makes cells that contain the word "Nissan" read-only. It forces all cells to be processed by the [`cells`](@/api/options.md#cells) function which will decide whether a cell's metadata should have the [`readOnly`](@/api/options.md#readonly) property set.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/javascript/example2.js)
@[code](@/content/guides/cell-features/disabled-cells/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/react/example2.jsx)
@[code](@/content/guides/cell-features/disabled-cells/react/example2.tsx)

:::

:::

Non-editable cells behave like any other cells apart from preventing you from manually changing their values.

## Non-editable columns

In many cases, you will need to configure a certain column to be non-editable. Doing this does not change its basic behaviour, apart from editing. This means that you can still use the keyboard navigation <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, and <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**V**</kbd> functionalities, and drag-to-fill, etc.

To make a column non-editable, declare it in the [`columns`](@/api/options.md#columns) configuration option. You can also define a special renderer function that will dim the `editor` value. This will provide the user with a visual cue that the cell is non-editable.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/javascript/example3.js)
@[code](@/content/guides/cell-features/disabled-cells/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/react/example3.jsx)
@[code](@/content/guides/cell-features/disabled-cells/react/example3.tsx)

:::

:::

## Non-editable specific cells

The following example shows the table with non-editable cells containing the word "Nissan". This cell property is optional and you can easily set it in the Handsontable configuration.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/javascript/example4.js)
@[code](@/content/guides/cell-features/disabled-cells/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/disabled-cells/react/example4.jsx)
@[code](@/content/guides/cell-features/disabled-cells/react/example4.tsx)

:::

:::

## Related API reference

- Configuration options:
  - [`readOnly`](@/api/options.md#readonly)
  - [`readOnlyCellClassName`](@/api/options.md#readonlycellclassname)

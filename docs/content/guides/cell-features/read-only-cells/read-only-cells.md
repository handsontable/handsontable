---
type: how-to
title: Read-only cells
metaTitle: Read-only cells - JavaScript Data Grid | Handsontable
description: Make specified cells read-only to protect them from unwanted changes but still allow navigation and copying of data.
permalink: /read-only-cells
canonicalUrl: /read-only-cells
tags:
  - read-only
  - readonly
  - non-editable
  - noneditable
  - locked
react:
  metaTitle: Read-only cells - React Data Grid | Handsontable
angular:
  metaTitle: Read-only cells - Angular Data Grid | Handsontable
vue:
  metaTitle: Read-only cells - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell features
menuTag: updated
---
Make specified cells read-only to protect them from unwanted changes but still allow navigation and copying of data.

[[toc]]

Disable individual cells, entire columns, or entire rows to prevent user edits. Use `readOnly` on cells, columns, or the whole grid.

## Overview

Disabling a cell makes the cell read-only or non-editable. Both have similar outcomes, with the following differences:

| Read-only cell<br>`readOnly: true`                                           | Non-editable cell<br>`editor: false`                                       |
|------------------------------------------------------------------------------| -------------------------------------------------------------------------- |
| Has an additional CSS class (`htDimmed`)                                     | Has no additional CSS class                                                |
| Copy works, paste doesn't work                                               | Copy-paste works                                                           |
| Drag-to-fill doesn't work                                                    | Drag-to-fill works                                                         |
| Can't be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) | Can be changed by [`populateFromArray()`](@/api/core.md#populatefromarray) |

## Make the grid read-only

To make the entire grid read-only, set [`readOnly`](@/api/options.md#readonly) to `true` as a [top-level grid option](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).

::: only-for javascript

::: example #exampleReadOnlyGrid --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/javascript/exampleReadOnlyGrid.js)
@[code](@/content/guides/cell-features/read-only-cells/javascript/exampleReadOnlyGrid.ts)

:::

:::

::: only-for react

::: example #exampleReadOnlyGrid :react --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/react/exampleReadOnlyGrid.jsx)
@[code](@/content/guides/cell-features/read-only-cells/react/exampleReadOnlyGrid.tsx)

:::

:::

::: only-for angular

::: example #exampleReadOnlyGrid :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/read-only-cells/angular/exampleReadOnlyGrid.ts)
@[code](@/content/guides/cell-features/read-only-cells/angular/exampleReadOnlyGrid.html)

:::

:::

::: only-for vue

::: example #exampleReadOnlyGrid :vue3

@[code](@/content/guides/cell-features/read-only-cells/vue/exampleReadOnlyGrid.vue)

:::

:::

## Make a column read-only

To make a column read-only, declare it in the [`columns`](@/api/options.md#columns) configuration option. The column remains available for keyboard navigation and copying data (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>), but editing and pasting are disabled. The example below also defines a custom renderer that dims the read-only column, giving the user a visual cue that its cells are read-only.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/javascript/example1.js)
@[code](@/content/guides/cell-features/read-only-cells/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/react/example1.jsx)
@[code](@/content/guides/cell-features/read-only-cells/react/example1.tsx)

:::

:::

<!-- TODO: workaround for the template parsing problem for angular docs  -->

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/read-only-cells/angular/example1.ts)
@[code](@/content/guides/cell-features/read-only-cells/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-features/read-only-cells/vue/example1.vue)

:::

:::

## Make a row read-only

To make an entire row read-only, use the [`cells`](@/api/options.md#cells) function and set the [`readOnly`](@/api/options.md#readonly) property based on the row index, regardless of the column. The example below makes the second row (index `1`) read-only.

::: only-for javascript

::: example #example5 --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/javascript/example5.js)
@[code](@/content/guides/cell-features/read-only-cells/javascript/example5.ts)

:::

:::

::: only-for react

::: example #example5 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/react/example5.jsx)
@[code](@/content/guides/cell-features/read-only-cells/react/example5.tsx)

:::

:::

::: only-for angular

::: example #example5 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/read-only-cells/angular/example5.ts)
@[code](@/content/guides/cell-features/read-only-cells/angular/example5.html)

:::

:::

::: only-for vue

::: example #example5 :vue3

@[code](@/content/guides/cell-features/read-only-cells/vue/example5.vue)

:::

:::

## Make specific cells read-only

To make specific cells read-only, use the [`cells`](@/api/options.md#cells) function to set the [`readOnly`](@/api/options.md#readonly) property conditionally. The example below makes cells that contain the word "Nissan" read-only.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/javascript/example2.js)
@[code](@/content/guides/cell-features/read-only-cells/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/react/example2.jsx)
@[code](@/content/guides/cell-features/read-only-cells/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/read-only-cells/angular/example2.ts)
@[code](@/content/guides/cell-features/read-only-cells/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-features/read-only-cells/vue/example2.vue)

:::

:::

Non-editable cells behave like any other cells apart from preventing you from manually changing their values.

## Make a column non-editable

To make a column non-editable, declare it in the [`columns`](@/api/options.md#columns) configuration option. The column's basic behavior does not change -- you can still use keyboard navigation, <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**C**</kbd>, <kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**V**</kbd>, and drag-to-fill. The example below also defines a custom renderer that dims the non-editable column, giving the user a visual cue that its cells are non-editable.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/javascript/example3.js)
@[code](@/content/guides/cell-features/read-only-cells/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/react/example3.jsx)
@[code](@/content/guides/cell-features/read-only-cells/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/read-only-cells/angular/example3.ts)
@[code](@/content/guides/cell-features/read-only-cells/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-features/read-only-cells/vue/example3.vue)

:::

:::

## Make specific cells non-editable

To make specific cells non-editable, set `editor: false` in the cell configuration. The following example shows a table with non-editable cells containing the word "Nissan".

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/javascript/example4.js)
@[code](@/content/guides/cell-features/read-only-cells/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-features/read-only-cells/react/example4.jsx)
@[code](@/content/guides/cell-features/read-only-cells/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-features/read-only-cells/angular/example4.ts)
@[code](@/content/guides/cell-features/read-only-cells/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/cell-features/read-only-cells/vue/example4.vue)

:::

:::

## Accessibility

When [`ariaTags`](@/api/options.md#ariatags) is enabled (the default), Handsontable adds `aria-readonly="true"` to the DOM element of every read-only cell, so screen readers announce that the cell can't be edited. Non-editable cells (`editor: false`) don't get this attribute, because Handsontable doesn't treat them as read-only in the data model -- only their editor is disabled.

For more accessibility features and testing guidance, see [Accessibility](@/guides/accessibility/accessibility/accessibility.md).

## Result

Read-only cells display with the `htDimmed` CSS class and block paste and drag-to-fill operations. Non-editable cells block manual editing but allow copy-paste and drag-to-fill.

## Related API reference

**Configuration options**

<div class="boxes-list">

- [ariaTags](@/api/options.md#ariatags)
- [readOnly](@/api/options.md#readonly)
- [readOnlyCellClassName](@/api/options.md#readonlycellclassname)

</div>

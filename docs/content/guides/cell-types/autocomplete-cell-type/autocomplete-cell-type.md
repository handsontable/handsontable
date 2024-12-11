---
id: cjib1mhw
title: Autocomplete cell type
metaTitle: Autocomplete cell type - JavaScript Data Grid | Handsontable
description: Collect user input with a list of choices, by using the autocomplete cell type.
permalink: /autocomplete-cell-type
canonicalUrl: /autocomplete-cell-type
react:
  id: vnnvp396
  metaTitle: Autocomplete cell type - React Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Autocomplete cell type

Collect user input with a list of choices, by using the autocomplete cell type.

[[toc]]

## Overview

You can complete the autocomplete cell type in three different ways:
- Flexible mode
- Strict mode
- Strict mode using Ajax

## Autocomplete flexible mode

This example uses the `autocomplete` feature in the default flexible mode. In this mode, the user can choose one of the suggested options while typing or enter a custom value that is not included in the suggestions.

::: only-for javascript

::: example #example1 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example1.tsx)

:::

:::

## Autocomplete strict mode

This is the same example as above, the difference being that `autocomplete` now runs in strict mode. In this mode, the autocomplete cells will only accept values that are defined in the source array. The mouse and keyboard bindings are identical to the `Handsontable` cell type but with the differences below:

- If there is at least one option visible, there always is a selection in HOT-in-HOT
- When the first row is selected, pressing <kbd>**Arrow Up**</kbd> does not deselect HOT-in-HOT. Instead, it behaves as the <kbd>**Enter**</kbd> key but moves the selection in the main HOT upwards

In strict mode, the [`allowInvalid`](@/api/options.md#allowinvalid) option determines the behaviour in the case of manual user input:

- [`allowInvalid: true`](@/api/options.md#allowinvalid) optional - allows manual input of a value that does not exist in the `source`, the field background is highlighted in red, and the selection advances to the next cell
- [`allowInvalid: false`](@/api/options.md#allowinvalid) - does not allow manual input of a value that does not exist in the `source`, the <kbd>**Enter**</kbd> key is ignored, and the editor field remains open

::: only-for javascript

::: example #example2 .docs-height-large --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example2.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 .docs-height-large :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example2.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example2.tsx)

:::

:::

## Autocomplete strict mode (Ajax)

Autocomplete can also be used with Ajax data sources. In the example below, suggestions for the "Car" column are loaded from the server. To load data from a remote *asynchronous* source, assign a function to the 'source' property. The function should perform the server-side request and call the callback function when the result is available.

::: only-for javascript

::: example #example3 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example3.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example3.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example3.tsx)

:::

:::

## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [Select cell type](@/guides/cell-types/select-cell-type/select-cell-type.md)

### Related API reference

- Configuration options:
  - [`allowHtml`](@/api/options.md#allowhtml)
  - [`filteringCaseSensitive`](@/api/options.md#filteringcasesensitive)
  - [`sortByRelevance`](@/api/options.md#sortbyrelevance)
  - [`source`](@/api/options.md#source)
  - [`strict`](@/api/options.md#strict)
  - [`trimDropdown`](@/api/options.md#trimdropdown)
  - [`type`](@/api/options.md#type)
  - [`visibleRows`](@/api/options.md#visiblerows)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getDataType()`](@/api/core.md#getdatatype)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterSetCellMeta`](@/api/hooks.md#aftersetcellmeta)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeSetCellMeta`](@/api/hooks.md#beforesetcellmeta)

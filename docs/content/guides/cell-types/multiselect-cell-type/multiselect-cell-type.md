---
type: how-to
id: cjih3fhw
title: MultiSelect cell type
metaTitle: MultiSelect cell type - JavaScript Data Grid | Handsontable
description: Collect user input with a list of multiple-selection entries, by using the MultiSelect cell type.
permalink: /multiselect-cell-type
canonicalUrl: /multiselect-cell-type
react:
  id: vnhtf396
  metaTitle: MultiSelect cell type - React Data Grid | Handsontable
angular:
  id: mdg4dixm
  metaTitle: MultiSelect cell type - Angular Data Grid | Handsontable
vue:
  id: 6zrsi767
  metaTitle: MultiSelect cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---
Collect user input with a list of multiple-selection choices, by using the MultiSelect cell type.

The multiselect cell type lets users pick multiple values from a dropdown list. Values are stored as a comma-separated string or array.

[[toc]]

## Overview
The MultiSelect cell type is designed for scenarios where you need to save and manage a list of values within a single cell. With this cell type, users can open a dropdown menu containing all available options and select any number of values, rather than being limited to just one.

Once selections are made, the values are stored in the table's source data as an array associated with that particular cell. This approach provides both flexibility and clarity when working with datasets that require multiple values per field.

For a clear visual representation, the MultiSelect renderer displays each selected value as an individual, removable chip within the cell. This makes it easy for users to see exactly which values are selected at a glance and to remove any item with a single action if needed.

The list of selectable options (`source` property) can be provided in two formats:

- An array of values
- An array of objects with `key` and `value` properties

## Integration with formulas

When you use the MultiSelect cell type together with the [Formulas](@/api/options.md#formulas) plugin, Handsontable keeps MultiSelect values in source data as arrays.

HyperFormula doesn't accept arrays as direct cell values. Because of that, Handsontable converts MultiSelect arrays to comma-separated strings before passing values to HyperFormula. This behavior keeps the original array format in source data, and allows formula cells to reference MultiSelect values as text (for example, `"Frontend, Backend"`).

## The `source` option

The `source` option can be provided in two formats:

### Array of values

You can provide the `source` option as an array of values that will be used as the MultiSelect options.

::: only-for javascript
::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/multiselect-cell-type/javascript/example1.js)

@[code](@/content/guides/cell-types/multiselect-cell-type/javascript/example1.ts)

:::
:::

::: only-for react
::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/multiselect-cell-type/react/example1.jsx)

@[code](@/content/guides/cell-types/multiselect-cell-type/react/example1.tsx)

:::
:::

::: only-for angular
::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/multiselect-cell-type/angular/example1.ts)

@[code](@/content/guides/cell-types/multiselect-cell-type/angular/example1.html)

:::
:::

### Array of objects

You can provide the `source` option as an array of objects with `key` and `value` properties. The `value` property will be used as the MultiSelect's option label, while the entire object will be used as the value saved to the cell's source data.

::: only-for javascript
::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-types/multiselect-cell-type/javascript/example2.js)

@[code](@/content/guides/cell-types/multiselect-cell-type/javascript/example2.ts)

:::
:::

::: only-for react
::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/multiselect-cell-type/react/example2.jsx)

@[code](@/content/guides/cell-types/multiselect-cell-type/react/example2.tsx)

:::
:::


::: only-for angular
::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/multiselect-cell-type/angular/example2.ts)

@[code](@/content/guides/cell-types/multiselect-cell-type/angular/example2.html)

:::
:::

## Keyboard navigation

The MultiSelect editor is a dropdown with selectable items. You can select items by clicking them or by using the keyboard:

When the dropdown opens, the initial focus depends on the [**`searchInput`**](@/api/options.md#searchinput) option: if filtering is enabled, the search input is focused by default; if filtering is disabled, the first item in the list is focused.

- <kbd>**↑**</kbd><kbd>**↓**</kbd> – Move the focus between items in the dropdown list. When the search input is visible, use <kbd>**↓**</kbd> to move focus from the search input into the list, and <kbd>**↑**</kbd> to move focus back into the search input.
- <kbd>**Space**</kbd> or <kbd>**Enter**</kbd> – Toggle the selection of the focused item. The behavior depends on the [**`enterCommits`**](@/api/options.md#entercommits) option:
  - When `enterCommits` is `true` (default): <kbd>**Enter**</kbd> closes the editor and commits the selection; <kbd>**Space**</kbd> toggles the focused item's selection.
  - When `enterCommits` is `false`: <kbd>**Enter**</kbd> toggles the focused item's selection; <kbd>**Space**</kbd> has no effect.

Each selection (or deselection) immediately updates the underlying cell data.

## Other options

The MultiSelect cell type provides several configuration options to tailor its behavior:

- [**`allowEmpty`**](@/api/options.md#allowempty) – Allows empty cell value to pass validation. This is set to `true` by default.
- [**`placeholder`**](@/api/options.md#placeholder) – Sets placeholder text that's rendered in the cell when the cell is empty.
- [**`visibleRows`**](@/api/options.md#visiblerows) – Defines the maximum number of visible rows in the dropdown menu.
- [**`maxSelections`**](@/api/options.md#maxselections) – Determines the maximum number of items that can be selected.
- [**`sourceSortFunction`**](@/api/options.md#sourcesortfunction) – A custom sort function to order the dropdown entries.
- [**`enterCommits`**](@/api/options.md#entercommits) – Controls whether pressing the <kbd>**Enter**</kbd> key closes the editor and commits the selection.
- [**`searchInput`**](@/api/options.md#searchinput) – Toggles the visibility of the search input inside the dropdown.
- [**`filteringCaseSensitive`**](@/api/options.md#filteringcasesensitive) – When set to `true`, the dropdown's search filtering is case sensitive.

These options allow you to modify the MultiSelect cell type's appearance, usability, and behavior to better fit your specific needs.

The demo below showcases some the options in an interactive example.

::: only-for javascript
::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-types/multiselect-cell-type/javascript/example3.js)

@[code](@/content/guides/cell-types/multiselect-cell-type/javascript/example3.ts)

:::
:::

::: only-for react
::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/multiselect-cell-type/react/example3.jsx)

@[code](@/content/guides/cell-types/multiselect-cell-type/react/example3.tsx)

:::
:::

::: only-for angular
::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/multiselect-cell-type/angular/example3.ts)

@[code](@/content/guides/cell-types/multiselect-cell-type/angular/example3.html)

:::
:::

#### API methods

When working with object-based MultiSelect data, you can use methods like [`getSourceData()`](@/api/core.md#getsourcedata), [`getSourceDataAtCell()`](@/api/core.md#getsourcedataatcell), [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) etc., to get the data array in its original object format with both `key` and `value` properties. The [`getData()`](@/api/core.md#getdata) method will return only the `value` property's value in the array.


::: tip

**Note:** When the `source` option is declared as an array of `key` + `value` objects, the data in the edited cell should also be an array with `key` + `value` objects.

:::


## Result

After configuring the multiselect cell type, cells display a dropdown that allows selecting multiple items. Each selected value appears as a removable chip inside the cell. The underlying data source stores the selections as an array (or as a comma-separated string when used with the Formulas plugin).

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Autocomplete cell type](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [Select cell type](@/guides/cell-types/select-cell-type/select-cell-type.md)

</div>

**Related blog articles**

<div class="boxes-list gray">

- [Handsontable 17.0.0: Multiselect Cell Type, Simpler Custom Cells, and a New Themes API](https://handsontable.com/blog/handsontable-17.0.0-multiselect-cell-type-simpler-custom-cells-and-a-new-themes-api)

</div>

**Configuration options**

<div class="boxes-list">

- [allowEmpty](@/api/options.md#allowempty)
- [placeholder](@/api/options.md#placeholder)
- [visibleRows](@/api/options.md#visiblerows)
- [maxSelections](@/api/options.md#maxselections)
- [sourceSortFunction](@/api/options.md#sourcesortfunction)
- [enterCommits](@/api/options.md#entercommits)
- [searchInput](@/api/options.md#searchinput)
- [filteringCaseSensitive](@/api/options.md#filteringcasesensitive)

</div>

**Core methods**

<div class="boxes-list">

- [getData()](@/api/core.md#getdata)
- [getSourceData()](@/api/core.md#getsourcedata)
- [getDataAtCell()](@/api/core.md#getdataatcell)
- [getSourceDataAtCell()](@/api/core.md#getsourcedataatcell)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getDataType()](@/api/core.md#getdatatype)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)

</div>

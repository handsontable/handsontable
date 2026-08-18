---
type: how-to
title: Autocomplete cell type
metaTitle: Autocomplete cell type - JavaScript Data Grid | Handsontable
description: Collect user input with a list of choices, by using the autocomplete cell type.
permalink: /autocomplete-cell-type
canonicalUrl: /autocomplete-cell-type
tags:
  - dropdown
  - select
  - autocomplete
  - key value
react:
  metaTitle: Autocomplete cell type - React Data Grid | Handsontable
angular:
  metaTitle: Autocomplete cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Autocomplete cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
menuTag: updated
---
Collect user input with a list of choices, by using the autocomplete cell type.

The autocomplete cell type provides a text input with suggestions from a predefined list. Use it when users should choose from known values but can also type freely.

[[toc]]

## Overview
You can edit the autocomplete-typed cells in three different ways:

- Flexible mode
- Strict mode
- Strict mode with asynchronous data

In all three modes, the `source` option can be provided in two formats:

- An array of values
- An array of objects with `key` and `value` properties

## Autocomplete flexible mode

This example uses the `autocomplete` feature in the default flexible mode. In this mode, the user can choose one of the suggested options while typing or enter a custom value that is not included in the suggestions.

The [`visibleRows`](@/api/options.md#visiblerows) option sets how many suggestions the dropdown shows without scrolling. The default is 10 rows. The **Chassis color** column sets `visibleRows: 4`, so the dropdown shows only four suggestions at a time and scrolls to reveal the rest.

The [`trimDropdown`](@/api/options.md#trimdropdown) option controls the dropdown's width. By default (`trimDropdown: true`), the dropdown matches the width of the edited cell, which can truncate long suggestions. The **Bumper color** column sets `trimDropdown: false`, so the dropdown expands to fit its widest suggestion. It can grow wider than the cell, but never narrower.

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

::: only-for angular

::: example #example1 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example1.vue)

:::

:::

## Autocomplete strict mode

This is the same example as above, the difference being that `autocomplete` now runs in strict mode. In this mode, the autocomplete cells will only accept values that are defined in the source array. The mouse and keyboard bindings are identical to the [`handsontable` cell type](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) but with the differences below:

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

::: only-for angular

::: example #example2 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example2.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 .docs-height-large :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example2.vue)

:::

:::

<span id="autocomplete-strict-mode-ajax"></span>

## Autocomplete strict mode with asynchronous data

Autocomplete can also use asynchronous data sources. In the example below, suggestions for the "Car" column are loaded from the server with the Fetch API. To load data from a remote source, assign a function to the `source` option. The function receives the query string and the `process` callback. Call `process()` with the result array when the request completes.

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

::: only-for angular

::: example #example3 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example3.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example3.vue)

:::

:::

## The `source` option

The `source` option can be provided in two formats:

### Array of values

You can provide the `source` option as an array of values that will be used as the autocomplete suggestions.

::: only-for javascript
::: example #example4 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example4.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example4.ts)

:::
:::

::: only-for react
::: example #example4 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example4.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example4.tsx)

:::
:::

::: only-for angular
::: example #example4 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example4.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example4.html)

:::
:::

::: only-for vue

::: example #example4 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example4.vue)

:::

:::

### Array of objects

You can provide the `source` option as an array of objects with `key` and `value` properties. The `value` property will be used as the autocomplete suggestion, while the entire object will be used as the value of the cell.

::: only-for javascript
::: example #example5 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example5.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example5.ts)

:::
:::

::: only-for react
::: example #example5 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example5.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example5.tsx)

:::
:::

::: only-for angular
::: example #example5 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example5.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example5.html)

:::
:::

::: only-for vue

::: example #example5 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example5.vue)

:::

:::

#### API methods

When working with object-based autocomplete data, you can use methods like [`getSourceData()`](@/api/core.md#getsourcedata), [`getSourceDataAtCell()`](@/api/core.md#getsourcedataatcell), [`getSourceDataAtRow()`](@/api/core.md#getsourcedataatrow) etc., to get the data in its original object format with both `key` and `value` properties. The [`getData()`](@/api/core.md#getdata) method will return only the `value` property's value.


::: tip

**Note:** When the `source` option is declared as an array of `key` + `value` objects, the data in the edited cell should also be an object with `key` + `value` properties.

:::


## The `filter` option

By default, the autocomplete dropdown hides options that don't match what the user is typing. Set `filter: false` to always show the full list of source options, regardless of the current input. This is useful when you want to give users a visual reference of all available choices while they type.

The left column uses the default behavior (`filter: true`) — options are narrowed as you type. The right column has `filter: false` — all options remain visible no matter what you enter.

::: only-for javascript

::: example #example6 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example6.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example6.ts)

:::

:::

::: only-for react

::: example #example6 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example6.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example6.tsx)

:::

:::

::: only-for angular

::: example #example6 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example6.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example6.html)

:::

:::

::: only-for vue

::: example #example6 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example6.vue)

:::

:::

## The `filteringCaseSensitive` option

By default, the autocomplete search is case-insensitive — typing `"bl"` matches both `"Black"` and `"blue"`. Set `filteringCaseSensitive: true` to require an exact case match when filtering suggestions.

The left column uses the default case-insensitive behavior. The right column has `filteringCaseSensitive: true` — only options whose case matches the typed characters are shown.

::: only-for javascript

::: example #example7 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example7.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example7.ts)

:::

:::

::: only-for react

::: example #example7 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example7.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example7.tsx)

:::

:::

::: only-for angular

::: example #example7 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example7.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example7.html)

:::

:::

::: only-for vue

::: example #example7 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example7.vue)

:::

:::

## The `sortByRelevance` option

By default, the autocomplete dropdown shows suggestions in the order you provide them in the `source` array. Set `sortByRelevance: false` to sort suggestions alphabetically instead.

The left column uses the default behavior (`sortByRelevance: true`) — suggestions keep the order from `source`. The right column has `sortByRelevance: false` — suggestions sort alphabetically.

::: only-for javascript

::: example #example8 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example8.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example8.ts)

:::

:::

::: only-for react

::: example #example8 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example8.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example8.tsx)

:::

:::

::: only-for angular

::: example #example8 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example8.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example8.html)

:::

:::

::: only-for vue

::: example #example8 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example8.vue)

:::

:::

## The `allowHtml` option

By default, the autocomplete dropdown and cell renderer display `source` values as plain text, so any HTML tags they contain show up literally. Set `allowHtml: true` to render `source` values as HTML instead, for example to show colored status labels.

::: warning Security

Handsontable doesn't sanitize HTML rendered through `allowHtml`. Only enable it for static, trusted `source` data. Rendering `source` values that come from user input creates XSS vulnerabilities. See [Security](@/guides/security/security/security.md) for details.

:::

The left column uses the default behavior (`allowHtml: false`) — HTML tags in `source` show up as plain text. The right column has `allowHtml: true` — the same `source` values render as colored labels.

::: only-for javascript

::: example #example9 .docs-height-small --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example9.js)
@[code](@/content/guides/cell-types/autocomplete-cell-type/javascript/example9.ts)

:::

:::

::: only-for react

::: example #example9 .docs-height-small :react --js 1 --ts 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example9.jsx)
@[code](@/content/guides/cell-types/autocomplete-cell-type/react/example9.tsx)

:::

:::

::: only-for angular

::: example #example9 .docs-height-small :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example9.ts)
@[code](@/content/guides/cell-types/autocomplete-cell-type/angular/example9.html)

:::

:::

::: only-for vue

::: example #example9 .docs-height-small :vue3

@[code](@/content/guides/cell-types/autocomplete-cell-type/vue/example9.vue)

:::

:::

## Result

After configuring the autocomplete cell type, cells display a text input that shows matching suggestions as the user types. In strict mode, only values from the source list are accepted. In flexible mode, users can also enter custom values not in the list.

## Keyboard shortcuts

The autocomplete cell editor shares its keyboard shortcuts with the [`handsontable` editor](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#handsontable-editor-keyboard-shortcuts). In strict mode, a few of these shortcuts behave differently -- see [Autocomplete strict mode](#autocomplete-strict-mode).

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Dropdown cell type](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md)
- [Select cell type](@/guides/cell-types/select-cell-type/select-cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [allowHtml](@/api/options.md#allowhtml)
- [allowInvalid](@/api/options.md#allowinvalid)
- [filter](@/api/options.md#filter)
- [filteringCaseSensitive](@/api/options.md#filteringcasesensitive)
- [sortByRelevance](@/api/options.md#sortbyrelevance)
- [source](@/api/options.md#source)
- [strict](@/api/options.md#strict)
- [trimDropdown](@/api/options.md#trimdropdown)
- [type](@/api/options.md#type)
- [visibleRows](@/api/options.md#visiblerows)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getDataType()](@/api/core.md#getdatatype)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)

</div>

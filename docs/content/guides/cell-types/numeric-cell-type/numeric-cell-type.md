---
id: l5a447bl
title: Numeric cell type
metaTitle: Numeric cell type - JavaScript Data Grid | Handsontable
description: Display, format, sort, and filter numbers correctly by using the numeric cell type.
permalink: /numeric-cell-type
canonicalUrl: /numeric-cell-type
react:
  id: e6zmmawj
  metaTitle: Numeric cell type - React Data Grid | Handsontable
angular:
  id: odhu846f
  metaTitle: Numeric cell type - Angular Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---

# Numeric cell type

Display, format, sort, and filter numbers correctly by using the numeric cell type.

[[toc]]

## Overview

The default cell type in Handsontable is text. The data of a text cell is processed as a `string`
type that corresponds to the value of the text editor's internal `<textarea>` element. However,
there are many cases where you need cell values to be treated as a `number` type. The numeric cell
type allows you to format displayed numbers nicely and sort them correctly.

## Numeric cell type demo

In the following demo, columns **Year**, **Price ($)**, and **Price (€)** use the numeric cell type.
Click on the column names to sort them.

::: only-for javascript

::: example #example1 :hot --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/numeric-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/numeric-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/numeric-cell-type/angular/example1.html)

:::

:::

## Use the numeric cell type

To use the numeric cell type, set the [`type`](@/api/options.md#type) option to `'numeric'`:

::: only-for javascript

```js
// set the numeric cell type for each cell of the entire grid
type: 'numeric',

// set the numeric cell type for each cell of a single column
columns: [
  {
    type: 'numeric',
  },
]

// set the numeric cell type for a single cell
cell: [
  {
    row: 0,
    col: 0,
    type: 'numeric',
  }
],
```

:::

::: only-for react

```jsx
// set the numeric cell type for each cell of the entire grid
type={'numeric'},

// set the numeric cell type for each cell of a single column
columns={[{
  type: 'numeric',
}]}

// set the numeric cell type for a single cell
cell={[{
  row: 0,
  col: 0,
  type: 'numeric',
}]}
```

:::

::: only-for angular

```ts
// set the numeric cell type for each cell of the entire grid
settings1 = {
  type: "numeric",
};

// set the numeric cell type for each cell of a single column
settings2 = {
  columns: [
    {
      type: "numeric",
    },
  ],
};

// set the numeric cell type for a single cell
settings3 = {
  cell: [
    {
      row: 0,
      col: 0,
      type: "numeric",
    },
  ],
};
```

:::

Mind that Handsontable doesn't parse strings to numbers. In your data source, make sure to store
numeric cell values as numbers, not as strings.

All positive and negative integers whose magnitude is no greater than 253 (+/- 9007199254740991) are
representable in the `Number` type, i.e., as a safe integer. Any calculations that are performed on
bigger numbers won't be calculated precisely, due to JavaScript's limitations.

## Format numbers

To format the display of numeric values in [cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md),
use the [`numericFormat`](@/api/options.md#numericformat) option. It accepts all options supported by [`Intl.NumberFormat()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat).

**Style options:**

| Property          | Possible values                                           | Description                                                    |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `style`           | `'decimal'` (default), `'currency'`, `'percent'`, `'unit'`| The formatting style to use                                    |
| `currency`        | ISO 4217 currency codes (e.g., `'USD'`, `'EUR'`, `'PLN'`) | Required when `style` is `'currency'`                          |
| `currencyDisplay` | `'symbol'` (default), `'narrowSymbol'`, `'code'`, `'name'`| How to display the currency                                    |
| `currencySign`    | `'standard'` (default), `'accounting'`                    | Use parentheses for negative values in accounting format       |
| `unit`            | `'kilometer'`, `'liter'`, `'day'`, '`megabyte`' [etc.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#supported_unit_identifiers)        | Required when `style` is `'unit'`                              |
| `unitDisplay`     | `'short'` (default), `'narrow'`, `'long'`                 | How to display the unit                                        |

**Digit options:**

| Property                   | Possible values                              | Description                                                                 |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `minimumIntegerDigits`     | `1` (default) to `21`                        | Minimum number of integer digits; pads with leading zeros if needed         |
| `minimumFractionDigits`    | `0` to `100`                                 | Minimum number of fraction digits                                           |
| `maximumFractionDigits`    | `0` to `100`                                 | Maximum number of fraction digits                                           |
| `minimumSignificantDigits` | `1` to `21`                                  | Minimum number of significant digits                                        |
| `maximumSignificantDigits` | `1` to `21`                                  | Maximum number of significant digits                                        |
| `roundingPriority`         | `'auto'` (default), `'morePrecision'`, `'lessPrecision'` | How to resolve conflicts between fraction and significant digit settings |

**Rounding options:**

| Property               | Possible values                                                                                               | Description                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `roundingMode`         | `'ceil'`, `'floor'`, `'expand'`, `'trunc'`, `'halfCeil'`, `'halfFloor'`, `'halfExpand'` (default), `'halfTrunc'`, `'halfEven'` | How to round numbers                    |
| `roundingIncrement`    | `1` (default), `2`, `5`, `10`, `20`, `25`, `50`, `100`, `200`, `250`, `500`, `1000`, `2000`, `2500`, `5000`    | Increment for rounding (e.g., nearest 5 cents)                 |
| `trailingZeroDisplay`  | `'auto'` (default), `'stripIfInteger'`                                                                        | Whether to remove trailing zeros on whole numbers              |

**Other options:**

| Property          | Possible values                                                            | Description                                                    |
| ----------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `notation`        | `'standard'` (default), `'scientific'`, `'engineering'`, `'compact'`       | Formatting notation (e.g., `1.23E4` for scientific)            |
| `compactDisplay`  | `'short'` (default), `'long'`                                              | How to display compact notation (e.g., `1K` vs `1 thousand`)   |
| `useGrouping`     | `'auto'` (default), `true`, `false`, `'always'`, `'min2'`                  | Whether to use grouping separators (e.g., thousands separator) |
| `signDisplay`     | `'auto'` (default), `'always'`, `'exceptZero'`, `'negative'`, `'never'`    | When to display the sign                                       |

**Locale options:**

| Property          | Possible values                                           | Description                                                    |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `localeMatcher`   | `'lookup'`, `'best fit'` (default)                        | The locale matching algorithm to use                           |
| `numberingSystem` | `'arab'`, `'hans'`, `'mathsans'`, [etc.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf#supported_numbering_system_types) | The numbering system to use (e.g., Arabic-Indic digits)        |

When [`numericFormat`](@/api/options.md#numericformat) is not set, numbers are formatted with the defaults: `useGrouping: false` and `maximumFractionDigits: 20`.

In the following demo, columns **Price in Japan** and **Price in Turkey** use two different
[`numericFormat`](@/api/options.md#numericformat) configurations.

::: only-for javascript

::: example #example3 :hot --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example3.js)
@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/numeric-cell-type/react/example3.jsx)
@[code](@/content/guides/cell-types/numeric-cell-type/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/numeric-cell-type/angular/example3.ts)
@[code](@/content/guides/cell-types/numeric-cell-type/angular/example3.html)

:::

:::

Mind that the [`numericFormat`](@/api/options.md#numericformat) option doesn't change the way
numbers are presented or parsed by the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md). When
you edit a numeric cell:

- Regardless of the [`numericFormat`](@/api/options.md#numericformat) configuration, the number
  that's being edited displays its decimal separator as a period (`.`), and has no thousands
  separator or currency symbol.<br>For example, during editing `$7,000.02`, the number displays as
  `7000.02`.
- You can enter a decimal separator either with a period (`.`), or with a comma (`,`).
- You can't enter a thousands separator. After you finish editing the cell, the thousands
  separator is added automatically, based on your [`numericFormat`](@/api/options.md#numericformat)
  configuration.

## Related articles

### Related guides

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

### Related API reference

- Configuration options:
  - [`numericFormat`](@/api/options.md#numericformat)
  - [`type`](@/api/options.md#type)
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
- External references:
  - [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)

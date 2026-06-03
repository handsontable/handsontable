---
type: how-to
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
vue:
  id: 31btf76b
  metaTitle: Numeric cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
---
Display, format, sort, and filter numbers correctly by using the numeric cell type.

The numeric cell type formats numbers using Intl.NumberFormat, right-aligns values, and restricts input to valid numbers.

[[toc]]

## Overview

The default cell type in Handsontable is text. The data of a text cell is processed as a `string`
type that corresponds to the value of the text editor's internal `<textarea>` element. However,
there are many cases where you need cell values to be treated as a `number` type. The numeric cell
type allows you to format displayed numbers nicely and sort them correctly.

## Numeric cell type demo

In the following demo, multiple columns use the numeric cell type with different formatting styles:
- **Year**: Basic numeric formatting
- **Price (USD)** and **Price (EUR)**: Currency formatting
- **Distance**: Unit formatting (kilometers) with grouping
- **Fuel**: Unit formatting (liters) with decimal precision
- **Discount**: Percentage formatting
- **Quantity**: Decimal formatting with thousands separators

Use the locale selector above the table to see how different locales affect number formatting.

::: only-for javascript

::: example #example1 --html 1 --js 2 --ts 3

@[code](@/content/guides/cell-types/numeric-cell-type/javascript/example1.html)
@[code collapse={13-64,70-134}](@/content/guides/cell-types/numeric-cell-type/javascript/example1.js)
@[code collapse={14-65,71-135}](@/content/guides/cell-types/numeric-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code collapse={8-30,68-119,159-223}](@/content/guides/cell-types/numeric-cell-type/react/example1.jsx)
@[code collapse={20-42,80-131,171-235}](@/content/guides/cell-types/numeric-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code collapse={58-133,144-208}](@/content/guides/cell-types/numeric-cell-type/angular/example1.ts)
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

To format the look of numeric values in [cell renderers](@/guides/cell-functions/cell-renderer/cell-renderer.md),
use the [`numericFormat`](@/api/options.md#numericformat) option.

Since Handsontable 17.0, the `numericFormat` option supports the native [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) API, which provides better performance and broader browser support without external dependencies.

### Using Intl.NumberFormat

The `numericFormat` option accepts all properties of [`Intl.NumberFormatOptions`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat). The locale is controlled separately via the [`locale`](@/api/options.md#locale) option.

::: only-for javascript

```js
columns: [
  {
    type: 'numeric',
    locale: 'en-US',
    numericFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }
  },
  {
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }
  }
]
```

:::

::: only-for react

```jsx
<HotTable
  columns={[{
    type: 'numeric',
    locale: 'en-US',
    numericFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }
  }, {
    type: 'numeric',
    locale: 'de-DE',
    numericFormat: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }
  }]}
/>
```

:::

::: only-for angular

```ts
settings = {
  columns: [
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }
    },
    {
      type: 'numeric',
      locale: 'de-DE',
      numericFormat: {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
      }
    }
  ]
};
```

:::

**Common formatting styles:**

- **Currency**: Use `style: 'currency'` with a `currency` property (e.g., `'USD'`, `'EUR'`, `'PLN'`)
- **Decimal**: Use `style: 'decimal'` with `useGrouping: true` for thousands separators
- **Percent**: Use `style: 'percent'` for percentage formatting
- **Unit**: Use `style: 'unit'` with a `unit` property (e.g., `'kilometer'`, `'liter'`)

**Available options:**

**Style options:**

| Property          | Possible values                                           | Description                                                    |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `style`           | `'decimal'` (default), `'currency'`, `'percent'`, `'unit'`| The formatting style to use                                    |
| `currency`        | ISO 4217 currency codes (e.g., `'USD'`, `'EUR'`, `'PLN'`) | Required when `style` is `'currency'`                          |
| `currencyDisplay` | `'symbol'` (default), `'narrowSymbol'`, `'code'`, `'name'`| How to display the currency                                    |
| `currencySign`    | `'standard'` (default), `'accounting'`                    | Use parentheses for negative values in accounting format       |
| `unit`            | Unit identifiers (e.g., `'kilometer'`, `'liter'`)         | Required when `style` is `'unit'`                              |
| `unitDisplay`     | `'short'` (default), `'narrow'`, `'long'`                 | How to display the unit                                        |

**Notation options:**

| Property          | Possible values                                               | Description                                              |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `notation`        | `'standard'` (default), `'scientific'`, `'engineering'`, `'compact'` | The formatting notation                           |
| `compactDisplay`  | `'short'` (default), `'long'`                                 | Display style for compact notation (e.g., `1.5M` vs `1.5 million`) |

**Sign and grouping options:**

| Property          | Possible values                                                     | Description                                        |
| ----------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `signDisplay`     | `'auto'` (default), `'never'`, `'always'`, `'exceptZero'`, `'negative'` | When to display the sign                       |
| `useGrouping`     | `true`, `false` (default), `'always'`, `'auto'`, `'min2'`           | Whether to use grouping separators (e.g., `1,000`) |

**Digit options:**

| Property                  | Possible values | Description                                                   |
| ------------------------- | --------------- | ------------------------------------------------------------- |
| `minimumIntegerDigits`    | `1` to `21`     | Minimum number of integer digits (pads with zeros)            |
| `minimumFractionDigits`   | `0` to `100`    | Minimum number of fraction digits                             |
| `maximumFractionDigits`   | `0` to `100`    | Maximum number of fraction digits                             |
| `minimumSignificantDigits`| `1` to `21`     | Minimum number of significant digits                          |
| `maximumSignificantDigits`| `1` to `21`     | Maximum number of significant digits                          |

**Rounding options:**

| Property              | Possible values                                                                                     | Description                          |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `roundingMode`        | `'halfExpand'` (default), `'ceil'`, `'floor'`, `'expand'`, `'trunc'`, `'halfCeil'`, `'halfFloor'`, `'halfTrunc'`, `'halfEven'` | Rounding algorithm |
| `roundingPriority`    | `'auto'` (default), `'morePrecision'`, `'lessPrecision'`                                            | Priority between fraction and significant digits |
| `roundingIncrement`   | `1`, `2`, `5`, `10`, `20`, `25`, `50`, `100`, `200`, `250`, `500`, `1000`, `2000`, `2500`, `5000`    | Increment for rounding (e.g., nickel rounding) |
| `trailingZeroDisplay` | `'auto'` (default), `'stripIfInteger'`                                                              | Whether to strip trailing zeros for integers |

**Locale options:**

| Property          | Possible values                                           | Description                                        |
| ----------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `localeMatcher`   | `'best fit'` (default), `'lookup'`                        | Locale matching algorithm                          |
| `numberingSystem` | `'latn'`, `'arab'`, `'hans'`, `'deva'`, `'thai'`, etc.    | Numbering system to use                            |

For a complete reference, see the [`numericFormat` API documentation](@/api/options.md#numericformat) or [MDN: Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options).

### Editor behavior

Mind that the [`numericFormat`](@/api/options.md#numericformat) option doesn't change the way
numbers are presented or parsed by the [cell editor](@/guides/cell-functions/cell-editor/cell-editor.md). When
you edit a numeric cell:

- Regardless of the [`numericFormat`](@/api/options.md#numericformat) configuration, the number
  that's being edited displays its decimal separator as a period (`.`), and has no thousands
  separator or currency symbol.<br>For example, during editing `$7,000.02`, the number displays as
  `7000.02`.
- You can enter a decimal separator either with a period (`.`), or with a comma (`,`).
- For European locales where the decimal separator is a comma (e.g., `de-DE`, `fr-FR`, `es-ES`),
  you can enter a dot-thousands grouped value such as `7.000` or `7.000,25`. Handsontable parses
  these as `7000` and `7000.25` respectively. For other locales, the thousands separator is added
  automatically after editing, based on your [`numericFormat`](@/api/options.md#numericformat)
  configuration.

## Result

After configuring the numeric cell type, cells right-align their values and display them using the format you defined in `numericFormat`. Invalid (non-numeric) input is rejected. The underlying data source stores the raw number.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [numericFormat](@/api/options.md#numericformat)
- [locale](@/api/options.md#locale)
- [type](@/api/options.md#type)
- [valueFormatter](@/api/options.md#valueformatter)

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

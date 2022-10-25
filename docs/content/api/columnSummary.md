---
title: ColumnSummary
metaTitle: ColumnSummary - JavaScript Data Grid | Handsontable
permalink: /api/column-summary
canonicalUrl: /api/column-summary
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the ColumnSummary plugin with its API options and methods to summarize your columns, using built-in functions or implementing custom summary functions.
react:
  metaTitle: ColumnSummary - React Data Grid | Handsontable
---

# ColumnSummary

[[toc]]

## Description

The `ColumnSummary` plugin lets you [easily summarize your columns](@/guides/columns/column-summary.md).

You can use the [built-in summary functions](@/guides/columns/column-summary.md#built-in-summary-functions),
or implement a [custom summary function](@/guides/columns/column-summary.md#implementing-a-custom-summary-function).

For each column summary, you can set the following configuration options:

| Option | Required | Type | Default | Description |
|---|---|---|---|---|
| `sourceColumn` | No | Number | Same as `destinationColumn` | [Selects a column to summarize](@/guides/columns/column-summary.md#step-2-select-cells-that-you-want-to-summarize) |
| `ranges` | No | Array | - | [Selects ranges of rows to summarize](@/guides/columns/column-summary.md#step-2-select-cells-that-you-want-to-summarize) |
| `type` | Yes | String | - | [Sets a summary function](@/guides/columns/column-summary.md#step-3-calculate-your-summary) |
| `destinationRow` | Yes | Number | - | [Sets the destination cell's row coordinate](@/guides/columns/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
| `destinationColumn` | Yes | Number | - | [Sets the destination cell's column coordinate](@/guides/columns/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
| `forceNumeric` | No | Boolean | `false` | [Forces the summary to treat non-numerics as numerics](@/guides/columns/column-summary.md#forcing-numeric-values) |
| `reversedRowCoords` | No | Boolean | `false` | [Reverses row coordinates](@/guides/columns/column-summary.md#step-5-make-room-for-the-destination-cell) |
| `suppressDataTypeErrors` | No | Boolean | `true` | [Suppresses data type errors](@/guides/columns/column-summary.md#throwing-data-type-errors) |
| `readOnly` | No | Boolean | `true` | Makes summary cell read-only |
| `roundFloat` | No | Number | - | [Rounds summary result](@/guides/columns/column-summary.md#rounding-a-column-summary-result) |
| `customFunction` | No | Function | - | [Lets you add a custom summary function](@/guides/columns/column-summary.md#implementing-a-custom-summary-function) |

**Example**  
::: only-for javascript
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'min',
      destinationRow: 4,
      destinationColumn: 1,
    },
    {
      type: 'max',
      destinationRow: 0,
      destinationColumn: 3,
      reversedRowCoords: true
    },
    {
      type: 'sum',
      destinationRow: 4,
      destinationColumn: 5,
      forceNumeric: true
    }
  ]
});
```
:::

::: only-for react
```jsx
<HotTable
  data={getData()}
  colHeaders={true}
  rowHeaders={true}
  columnSummary={[
    {
      type: 'min',
      destinationRow: 4,
      destinationColumn: 1,
    },
    {
      type: 'max',
      destinationRow: 0,
      destinationColumn: 3,
      reversedRowCoords: true
    },
    {
      type: 'sum',
      destinationRow: 4,
      destinationColumn: 5,
      forceNumeric: true
    }
  ]}
/>
```
:::

## Options

### columnSummary
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/dataMap/metaManager/metaSchema.js#L936

:::

_columnSummary.columnSummary : Array&lt;object&gt; | function_

The `columnSummary` option configures the [`ColumnSummary`](@/api/columnSummary.md) plugin.

You can set the `columnSummary` option to an array of objects.
Each object configures a single column summary, using the following properties:

| Property                 | Possible values                                                         | Description                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `sourceColumn`           | A number                                                                | [Column to summarize](@/guides/columns/column-summary.md#step-2-select-cells-that-you-want-to-summarize)                     |
| `ranges`                 | An array                                                                | [Ranges of rows to summarize](@/guides/columns/column-summary.md#step-2-select-cells-that-you-want-to-summarize)             |
| `type`                   | `'sum'` \| `'min'` \| `'max'` \| `'count'` \| `'average'` \| `'custom'` | [Summary function](@/guides/columns/column-summary.md#step-3-calculate-your-summary)                                         |
| `destinationRow`         | A number                                                                | [Destination cell's row coordinate](@/guides/columns/column-summary.md#step-4-provide-the-destination-cell-s-coordinates)    |
| `destinationColumn`      | A number                                                                | [Destination cell's column coordinate](@/guides/columns/column-summary.md#step-4-provide-the-destination-cell-s-coordinates) |
| `forceNumeric`           | `true`  \| `false`                                                      | [Treat non-numerics as numerics](@/guides/columns/column-summary.md#forcing-numeric-values)                                  |
| `reversedRowCoords`      | `true`  \| `false`                                                      | [Reverse row coordinates](@/guides/columns/column-summary.md#step-5-make-room-for-the-destination-cell)                      |
| `suppressDataTypeErrors` | `true`  \| `false`                                                      | [Suppress data type errors](@/guides/columns/column-summary.md#throwing-data-type-errors)                                    |
| `readOnly`               | `true`  \| `false`                                                      | Make summary cell read-only                                                                                                  |
| `roundFloat`             | `true`  \| `false`                                                      | [Round summary result](@/guides/columns/column-summary.md#rounding-a-column-summary-result)                                  |
| `customFunction`         | A function                                                              | [Custom summary function](@/guides/columns/column-summary.md#implementing-a-custom-summary-function)                         |

Read more:
- [Column summary](@/guides/columns/column-summary.md)
- [Plugins: `ColumnSummary`](@/api/columnSummary.md)

**Default**: <code>undefined</code>  
**Example**  
```js
columnSummary: [
  {
    sourceColumn: 0,
    ranges: [
      [0, 2], [4], [6, 8]
    ],
    type: 'custom',
    destinationRow: 4,
    destinationColumn: 1,
    forceNumeric: true,
    reversedRowCoords: true,
    suppressDataTypeErrors: false,
    readOnly: true,
    roundFloat: false,
    customFunction(endpoint) {
       return 100;
    }
  }
],
```

## Methods

### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/columnSummary/columnSummary.js#L161

:::

_columnSummary.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/columnSummary/columnSummary.js#L129

:::

_columnSummary.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/plugins/columnSummary/columnSummary.js#L122

:::

_columnSummary.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ColumnSummary#enablePlugin](@/api/columnSummary.md#enableplugin) method is called.



---
type: how-to
title: Migrating from 8.4 to 9.0
metaTitle: Migrate from 8.4 to 9.0 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 8.4 to Handsontable 9.0, released on June 1, 2021.
permalink: /migration-from-8.4-to-9.0
canonicalUrl: /migration-from-8.4-to-9.0
pageClass: migration-guide
react:
  metaTitle: Migrate from 8.4 to 9.0 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 8.4 to 9.0 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 8.4 to 9.0 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 8.4 to Handsontable 9.0, released on June 1, 2021.

More information about this release can be found in the [`9.0.0` release blog post](https://handsontable.com/blog/handsontable-9.0.0-new-formula-plugin).<br/>
For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md#_9-0-0).

[[toc]]

## Overview

The purpose of this guide is to make it easier to migrate from v8.4.0 to v9.0.0. Handsontable 9.0 introduces a new formula engine that completely replaces the previous one. There is a breaking change in the formula API - even in the way the plugin itself is initialized.

## Plugin initialization

The plugin uses HyperFormula, which is meant to be passed in as an external dependency every time you want to initialize the plugin. See the [HyperFormula installation guide](https://handsontable.github.io/hyperformula/guide/client-side-installation.html).

::: only-for javascript

| Before 9.0 (legacy plugin) | After 9.0 (new plugin)                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `formulas: true`           | `import { HyperFormula } from 'hyperformula';`<br><br>`formulas: {`<br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; `engine: HyperFormula`<br>`}` |

:::

::: only-for react

| Before 9.0 (legacy plugin) | After 9.0 (new plugin)                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `formulas={true}`          | `import { HyperFormula } from 'hyperformula';`<br><br>`formulas={{`<br>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; `engine: HyperFormula`<br>`}}` |

:::

See the other [initialization methods](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods).

## Available methods

| Method name                                                                                      | Before 9.0 (legacy plugin)                                    | After 9.0 (new plugin)                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`destroy`](https://handsontable.com/docs/8.4.0/Formulas.html#destroy)                           | `hot.getPlugin('formulas').destroy()`                         | Unchanged. This method will destroy the HyperFormula instance only after it is disconnected from all Handsontable instances.                                                          |
| [`disablePlugin`](https://handsontable.com/docs/8.4.0/Formulas.html#disablePlugin)               | `hot.getPlugin('formulas').disablePlugin()`                   | Unchanged.                                                                                                                                                                            |
| [`enablePlugin`](https://handsontable.com/docs/8.4.0/Formulas.html#enablePlugin)                 | `hot.getPlugin('formulas').enablePlugin()`                    | Unchanged, but do keep in mind that if you didn't pass in the plugin's config through either `updateSettings` or during Handsontable initialization this method will not do anything. |
| [`getCellValue`](https://handsontable.com/docs/8.4.0/Formulas.html#getCellValue)                 | `hot.getPlugin('formulas').getCellValue(row, column)`         | Use base Handsontable API instead, for example `hot.getDataAtCell(row, column)`.                                                                                                      |
| [`getVariable`](https://handsontable.com/docs/8.4.0/Formulas.html#getVariable)                   | `hot.getPlugin('formulas').getVariable(variableName)`         | "Variables" in the plugin are replaced by a more powerful alternative, [named expressions](@/guides/formulas/formula-calculation/formula-calculation.md#named-expressions).                         |
| [`hasComputedCellValue`](https://handsontable.com/docs/8.4.0/Formulas.html#hasComputedCellValue) | `hot.getPlugin('formulas').hasComputedCellValue(row, column)` | `hot.getPlugin('formulas').getCellType(row, column) === 'FORMULA'`                                                                                                                    |
| [`isEnabled`](https://handsontable.com/docs/8.4.0/Formulas.html#isEnabled)                       | `hot.getPlugin('formulas').isEnabled()`                       | Unchanged.                                                                                                                                                                            |
| [`recalculate`](https://handsontable.com/docs/8.4.0/Formulas.html#recalculate)                   | `hot.getPlugin('formulas').recalculate()`                     | `hot.getPlguin('formulas').engine.rebuildAndRecalculate()`                                                                                                                            |
| [`recalculateFull`](https://handsontable.com/docs/8.4.0/Formulas.html#recalculateFull)           | `hot.getPlugin('formulas').recalculateFull()`                 | `hot.getPlguin('formulas').engine.rebuildAndRecalculate()`                                                                                                                            |
| [`recalculateOptimized`](https://handsontable.com/docs/8.4.0/Formulas.html#recalculateOptimized) | `hot.getPlugin('formulas').recalculateOptimized()`            | `hot.getPlguin('formulas').engine.rebuildAndRecalculate()`                                                                                                                            |
| [`setVariable`](https://handsontable.com/docs/8.4.0/Formulas.html#setVariable)                   | `hot.getPlugin('formulas').setVariable(variableName, value)`  | "Variables" in the plugin are replaced by a more powerful alternative, named expressions.                                                                                       |

## Available functions

HyperFormula has its own set of built-in functions, so it doesn't support every function name that the legacy formula engine did. A formula that uses a missing name returns `#NAME?`.

The legacy engine supported 382 function names. As of HyperFormula 3.3, 57 of them have no built-in function with the same name. The [list of functions HyperFormula supports](https://handsontable.com/docs/hyperformula/guide/built-in-functions.html) is the reference for everything else.

### Functions with a new name or an operator

Rewrite formulas that use these names. The operator-style functions also exist in HyperFormula under an `HF.` prefix, for example `HF.ADD(a, b)`.

| Legacy function                  | Use instead                        |
| -------------------------------- | ---------------------------------- |
| `ADD(a, b)`                      | `a + b` or `HF.ADD(a, b)`          |
| `MINUS(a, b)`                    | `a - b` or `HF.MINUS(a, b)`        |
| `MULTIPLY(a, b)`                 | `a * b` or `HF.MULTIPLY(a, b)`     |
| `DIVIDE(a, b)`                   | `a / b` or `HF.DIVIDE(a, b)`       |
| `EQ(a, b)`, `NE(a, b)`           | `a = b`, `a <> b`                  |
| `GTE(a, b)`                      | `a >= b`                           |
| `LT(a, b)`, `LTE(a, b)`          | `a < b`, `a <= b`                  |
| `POW(a, b)`                      | `POWER(a, b)`                      |
| `E()`                            | `EXP(1)`                           |
| `CEILINGMATH`, `CEILINGPRECISE`  | `CEILING.MATH`, `CEILING.PRECISE`  |
| `PERCENTILEINC`, `PERCENTILEEXC` | `PERCENTILE.INC`, `PERCENTILE.EXC` |
| `QUARTILEINC`, `QUARTILEEXC`     | `QUARTILE.INC`, `QUARTILE.EXC`     |

### Functions without a built-in equivalent

HyperFormula doesn't ship a function for these names:

`ACCRINT`, `AGGREGATE`, `ARGS2ARRAY`, `AVERAGEIFS`, `BINOM.DIST.RANGE`, `CONVERT`, `COUNTIN`, `FLATTEN`, `FORECAST`, `FREQUENCY`, `GESTEP`, `GROWTH`, `HTML2TEXT`, `INTERCEPT`, `JOIN`, `KURT`, `LINEST`, `LOGEST`, `MODE.MULT`, `MODE.SNGL`, `MODEMULT`, `MODESNGL`, `NUMBERS`, `PERCENTRANKEXC`, `PERCENTRANKINC`, `PERMUT`, `PERMUTATIONA`, `PROB`, `RANK.AVG`, `RANK.EQ`, `RANKAVG`, `RANKEQ`, `REFERENCE`, `REGEXEXTRACT`, `REGEXMATCH`, `REGEXREPLACE`, `TREND`, `TRIMMEAN`, `UNIQUE`, `XIRR`.

To keep a formula that uses one of these names working, you can [implement it as a custom function](@/guides/formulas/formula-calculation/formula-calculation.md#keep-legacy-function-names) with the same name. Functions that take ranges or arrays, such as `LINEST` or `UNIQUE`, need more work than scalar ones.

### Formula syntax

Two more differences affect formulas that worked before 9.0:

- HyperFormula separates function arguments with a comma. `=ROUND(1.7;2)` returns an error, and `=ROUND(1.7,2)` works. To keep the semicolon, set the HyperFormula [`functionArgSeparator`](https://handsontable.com/docs/hyperformula/api/interfaces/configparams.html#functionargseparator) option to `';'` in the [`engine` configuration](@/guides/formulas/formula-calculation/formula-calculation.md#initialization-methods):

  ```js
  formulas: {
    engine: {
      hyperformula: HyperFormula,
      functionArgSeparator: ';',
    },
  },
  ```

- `CEILING` requires two arguments. Change `=CEILING(56.2)` to `=CEILING(56.2,1)`.

### Migrate formulas that are already stored

If your application stores formulas, for example in a database, rewrite the functions from the first table before you load the data into the grid. Replace each legacy name with its new form. If you can't change the stored text, register a custom function with the legacy name instead, for any name in this section.

## Autofill hooks

To make autofill hooks more consistent and more powerful, [`beforeAutofill`](@/api/hooks.md#beforeautofill) and [`afterAutofill`](@/api/hooks.md#afterautofill) hooks have new signatures.

Before 9.0.0:

::: only-for javascript

```js
new Handsontable(container, {
  data,
  beforeAutofill(start, end, data) {},
  afterAutofill(start, end, data) {}
})
```

:::

::: only-for react

```jsx
<HotTable
  data={data}
  beforeAutofill={(start, end, data) {}}
  afterAutofill={(start, end, data) {}}
/>
```

:::

After:

::: only-for javascript

```js
new Handsontable(container, {
  data,
  beforeAutofill(selectionData, sourceRange, targetRange, direction) {
    const start = targetRange.from // used to be `start`
    const end = targetRange.to // used to be `end`
    const data = selectionData // used to be `data`
  },
  afterAutofill(fillData, sourceRange, targetRange, direction) {
    const start = targetRange.from // used to be `start`
    const end = targetRange.to // used to be `end`
    const data = fillData // used to be `data`
  }
})
```

:::

::: only-for react

```jsx
<HotTable
  data={data}
  beforeAutofill={(selectionData, sourceRange, targetRange, direction) {
    const start = targetRange.from // used to be `start`
    const end = targetRange.to // used to be `end`
    const data = selectionData // used to be `data`
  }}
  afterAutofill={(fillData, sourceRange, targetRange, direction) {
    const start = targetRange.from // used to be `start`
    const end = targetRange.to // used to be `end`
    const data = fillData // used to be `data`
  }}
/>
```

:::

In [`beforeAutofill`](@/api/hooks.md#beforeautofill) instead of mutating [`data`](@/api/options.md#data), you can now just return a new array of arrays with your desired fill pattern.

## Removed plugins

Handsontable 9.0.0 removes the following previously deprecated plugins:

- Header Tooltips
- Observe Changes

### Header tooltips

To implement functionality similar to that of the Header Tooltips plugin, you can utilize the [`afterGetColHeader`](@/api/hooks.md#aftergetcolheader) and [`afterGetRowHeader`](@/api/hooks.md#aftergetrowheader) hooks to add a `title` attribute to the headers.
See the snippet below for example implementation.

::: only-for javascript

```js
const onAfterGetHeader = function(index, TH) {
  TH.setAttribute('title', TH.querySelector('span').textContent);
};

const example = document.querySelector('#tooltip-example');
const hot = new Handsontable(example, {
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ],
  rowHeights: 23,
  autoColumnSize: true,
  rowHeaders: ['1st', '2nd', '3rd'],
  colHeaders: ['First Column', 'Second Column', 'Third Column'],
  licenseKey: 'non-commercial-and-evaluation',
  afterGetColHeader: onAfterGetHeader,
  afterGetRowHeader: onAfterGetHeader
});
```

:::

::: only-for react

```jsx
const onAfterGetHeader = function(index, TH) {
  TH.setAttribute('title', TH.querySelector('span').textContent);
};

<HotTable
  data={[
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ]}
  rowHeights={23}
  autoColumnSize={true}
  rowHeaders={['1st', '2nd', '3rd']}
  colHeaders={['First Column', 'Second Column', 'Third Column']}
  licenseKey="non-commercial-and-evaluation"
  afterGetColHeader={onAfterGetHeader}
  afterGetRowHeader={onAfterGetHeader}
/>
```

:::

### Observe changes

The plugin fired the [`afterChangesObserved`](@/api/hooks.md#afterchangesobserved) hook. Be sure to stop listening to it after updating to version `>=9.0.0`.

## Result

Your application now runs on Handsontable 9.0.

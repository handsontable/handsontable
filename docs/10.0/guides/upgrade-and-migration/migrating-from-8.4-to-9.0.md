---
title: Migrating from 8.4 to 9.0
metaTitle: Migrating from 8.4 to 9.0 - Guide - Handsontable Documentation
permalink: /10.0/migration-from-8.4-to-9.0
canonicalUrl: /migration-from-8.4-to-9.0
pageClass: migration-guide
---

# Migrating from 8.4 to 9.0

[[toc]]

The purpose of this guide is to make it easier to migrate from v8.4.0 to v9.0.0. In the version 9.0 we have introduced a new formula engine with has completely replaced the previous one. There is a breaking change in the formula API - even in the way the plugin itself is initialized.

## Plugin initialization

The plugin uses HyperFormula, which is meant to be passed in as an external dependency every time you want to initialize the plugin. HyperFormula installation guide is available [here](https://handsontable.github.io/hyperformula/guide/client-side-installation.html).

| Before 9.0 (legacy plugin) | After 9.0 (new plugin)|
| --- | --- |
| formulas: `true` | `import { HyperFormula } from 'hyperformula';`<br><br>`formulas: {`<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`engine: HyperFormula`<br>`}` |

See other available initialization methods [here](@/guides/formulas/formula-calculation.md#initialization-methods).

## Available methods

| Method name | Before 9.0 (legacy plugin) | After 9.0 (new plugin) |
|-|-|-|
| [`destroy`](https://handsontable.com/docs/8.4.0/Formulas.html#destroy) | `hot.getPlugin('formulas').destroy()` | Unchanged. This method will destroy the HyperFormula instance only after it is disconnected from all Handsontable instances. |
| [`disablePlugin`](https://handsontable.com/docs/8.4.0/Formulas.html#disablePlugin) | `hot.getPlugin('formulas').disablePlugin()` | Unchanged. |
| [`enablePlugin`](https://handsontable.com/docs/8.4.0/Formulas.html#enablePlugin) | `hot.getPlugin('formulas').enablePlugin()` | Unchanged, but do keep in mind that if you didn't pass in the plugin's config through either `updateSettings` or during Handsontable initialization this method will not do anything. |
| [`getCellValue`](https://handsontable.com/docs/8.4.0/Formulas.html#getCellValue) | `hot.getPlugin('formulas').getCellValue(row, column)` | Use base Handsontable API instead, for example `hot.getDataAtCell(row, column)`. |
| [`getVariable`](https://handsontable.com/docs/8.4.0/Formulas.html#getVariable) | `hot.getPlugin('formulas').getVariable(variableName)` | "Variables" in the plugin have been replaced by a more powerful alternative, [named expressions](@/guides/formulas/formula-calculation.md#named-expressions). |
| [`hasComputedCellValue`](https://handsontable.com/docs/8.4.0/Formulas.html#hasComputedCellValue) | `hot.getPlugin('formulas').hasComputedCellValue(row, column)` | `hot.getPlugin('formulas').getCellType(row, column) === 'FORMULA'` |
| [`isEnabled`](https://handsontable.com/docs/8.4.0/Formulas.html#isEnabled) | `hot.getPlugin('formulas').isEnabled()` | Unchanged. |
| [`recalculate`](https://handsontable.com/docs/8.4.0/Formulas.html#recalculate) | `hot.getPlugin('formulas').recalculate()` | `hot.getPlguin('formulas').engine.rebuildAndRecalculate()` |
| [`recalculateFull`](https://handsontable.com/docs/8.4.0/Formulas.html#recalculateFull) | `hot.getPlugin('formulas').recalculateFull()` | `hot.getPlguin('formulas').engine.rebuildAndRecalculate()` |
| [`recalculateOptimized`](https://handsontable.com/docs/8.4.0/Formulas.html#recalculateOptimized) | `hot.getPlugin('formulas').recalculateOptimized()` | `hot.getPlguin('formulas').engine.rebuildAndRecalculate()` |
| [`setVariable`](https://handsontable.com/docs/8.4.0/Formulas.html#setVariable) | `hot.getPlugin('formulas').setVariable(variableName, value)` | "Variables" in the plugin have been replaced by a more powerful alternative, [named expressions](@/guides/formulas/formula-calculation.md#named-expressions). |

## Available functions

[The list of available functions can be found here](https://github.com/handsontable/hyperformula/tree/master/src/interpreter/plugin).

## Autofill hooks

To make autofill hooks more consistent and more powerful, `beforeAutofill` and `afterAutofill` hooks have had their signatures changed.

Before 9.0.0:

```js
new Handsontable(container, {
  data,
  beforeAutofill(start, end, data) {},
  afterAutofill(start, end, data) {}
})
```

After:

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

In `beforeAutofill` instead of mutating `data`, you can now just return a new array of arrays with your desired fill pattern.

## Removed plugins

In Handsontable `9.0.0` we removed the following, previously-deprecated plugins:

*   Header Tooltips
*   Observe Changes

### Header Tooltips

To implement functionality similar to that of the Header Tooltips plugin, you can utilize the `afterGetColHeader` and `afterGetRowHeader` hooks to add a `title` attribute to the headers.  
See the snippet below for example implementation.

```js
const example = document.getElementById('tooltip-example');

const onAfterGetHeader = function(index, TH) {
  TH.setAttribute('title', TH.querySelector('span').textContent);
};

const hot = new Handsontable(example, {
  data: Handsontable.helper.createSpreadsheetData(3, 3),
  rowHeights: 23,
  autoColumnSize: true,
  rowHeaders: ['1st', '2nd', '3rd'],
  colHeaders: ['First Column', 'Second Column', 'Third Column'],
  licenseKey: 'non-commercial-and-evaluation',
  afterGetColHeader: onAfterGetHeader,
  afterGetRowHeader: onAfterGetHeader
});
```

### Observe Changes

The plugin fired the `afterChangesObserved` hook. Be sure to stop listening to it after updating to version `>=9.0.0`.

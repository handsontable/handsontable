---
title: ColumnSummary
metaTitle: ColumnSummary - Plugin - Handsontable Documentation
permalink: /next/api/column-summary
canonicalUrl: /api/column-summary
editLink: false
---

# ColumnSummary

[[toc]]

## Description

Allows making pre-defined calculations on the cell values and display the results within Handsontable.
[See the demo for more information](@/guides/columns/column-summary.md).

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      destinationRow: 4,
      destinationColumn: 1,
      type: 'min'
    },
    {
      destinationRow: 0,
      destinationColumn: 3,
      reversedRowCoords: true,
      type: 'max'
    },
    {
      destinationRow: 4,
      destinationColumn: 5,
      type: 'sum',
      forceNumeric: true
    }
  ]
});
```

## Options

### columnSummary
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/dataMap/metaManager/metaSchema.js#L2704

:::

_columnSummary.columnSummary : Array&lt;object&gt; | function_

Allows making pre-defined calculations on the cell values and display the results within Handsontable.

Possible types:
 * `'sum'`
 * `'min'`
 * `'max'`
 * `'count'`
 * `'average'`
 * `'custom'` - add `customFunction`.

[See the demo for more information](@/guides/columns/column-summary.md).

**Default**: <code>undefined</code>  
**Example**  
```js
columnSummary: [
  {
    destinationRow: 4,
    destinationColumn: 1,
    forceNumeric: true,
    reversedRowCoords: true,
    suppressDataTypeErrors: false,
    readOnly: true,
    roundFloat: false,
    type: 'custom',
    customFunction: function(endpoint) {
       return 100;
    }
  }
],
```

## Methods

### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/columnSummary/columnSummary.js#L109

:::

_columnSummary.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/columnSummary/columnSummary.js#L77

:::

_columnSummary.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/cc0c2380ac56edcef53c26bf9dc35eadf81459f8/src/plugins/columnSummary/columnSummary.js#L70

:::

_columnSummary.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ColumnSummary+enablePlugin) method is called.



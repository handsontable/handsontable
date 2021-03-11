---
title: ColumnSummary
permalink: /9.0/api/column-summary
canonicalUrl: /api/column-summary
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Allows making pre-defined calculations on the cell values and display the results within Handsontable.
[See the demo for more information](https://handsontable.com/docs/demo-summary-calculations.html).


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
## Functions:

### disablePlugin
`columnSummary.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
`columnSummary.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### isEnabled
`columnSummary.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ColumnSummary+enablePlugin) method is called.



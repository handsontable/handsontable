---
title: Freezing columns
permalink: /8.2/freezing
canonicalUrl: /freezing
---

# {{ $frontmatter.title }}

In order to manually freeze a column (in another words - make it fixed), you need to set the `manualColumnFreeze` config item to `true` in Handsontable initialization. When the Manual Column Freeze plugin is enabled, you can freeze any non-fixed column and unfreeze any fixed column in your Handsontable instance using the Context Menu.

**Note:** to properly use this plugin, you need to have the Context Menu plugin enabled.

**Note:** frozen columns won't attempt to go back to original positions upon the unfreeze. The plugin unfreezes the column just after the "line of freeze".

_If you're looking for an option to programmatically fix rows or columns, see the [Fixing](fixing.md) section of this documentation._

::: example #example1
```js
var
  myData = Handsontable.helper.createSpreadsheetData(100, 26),
  container = document.getElementById('example1'),
  hot;

hot = new Handsontable(container, {
  data: myData,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  fixedColumnsLeft: 2,
  contextMenu: true,
  manualColumnFreeze: true
});
```
:::

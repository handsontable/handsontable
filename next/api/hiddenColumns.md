---
title: HiddenColumns
permalink: /next/api/hidden-columns
canonicalUrl: /api/hidden-columns
---

# {{ $frontmatter.title }}

[[toc]]

## Description


Plugin allows to hide certain columns. The hiding is achieved by not rendering the columns. The plugin not modifies
the source data and do not participate in data transformation (the shape of data returned by `getData*` methods stays intact).

Possible plugin settings:
 * `copyPasteEnabled` as `Boolean` (default `true`)
 * `columns` as `Array`
 * `indicators` as `Boolean` (default `false`).


**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  hiddenColumns: {
    copyPasteEnabled: true,
    indicators: true,
    columns: [1, 2, 5]
  }
});

// access to hiddenColumns plugin instance:
const hiddenColumnsPlugin = hot.getPlugin('hiddenColumns');

// show single column
hiddenColumnsPlugin.showColumn(1);

// show multiple columns
hiddenColumnsPlugin.showColumn(1, 2, 9);

// or as an array
hiddenColumnsPlugin.showColumns([1, 2, 9]);

// hide single column
hiddenColumnsPlugin.hideColumn(1);

// hide multiple columns
hiddenColumnsPlugin.hideColumn(1, 2, 9);

// or as an array
hiddenColumnsPlugin.hideColumns([1, 2, 9]);

// rerender the table to see all changes
hot.render();
```
## Functions:

### destroy
`hiddenColumns.destroy()`

Destroys the plugin instance.



### disablePlugin
`hiddenColumns.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
`hiddenColumns.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getHiddenColumns
`hiddenColumns.getHiddenColumns() ⇒ Array.<number>`

Returns an array of visual indexes of hidden columns.



### hideColumn
`hiddenColumns.hideColumn(...column)`

Hides a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | <code>number</code> | Visual column index. |



### hideColumns
`hiddenColumns.hideColumns(columns)`

Hides the columns provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array.&lt;number&gt;</code> | Array of visual column indexes. |



### isEnabled
`hiddenColumns.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HiddenColumns+enablePlugin) method is called.



### isHidden
`hiddenColumns.isHidden(column) ⇒ boolean`

Checks if the provided column is hidden.


| Param | Type | Description |
| --- | --- | --- |
| column | <code>number</code> | Visual column index. |



### isValidConfig
`hiddenColumns.isValidConfig(hiddenColumns) ⇒ boolean`

Get if trim config is valid. Check whether all of the provided column indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenColumns | <code>Array</code> | List of hidden column indexes. |



### showColumn
`hiddenColumns.showColumn(...column)`

Shows a single column.


| Param | Type | Description |
| --- | --- | --- |
| ...column | <code>number</code> | Visual column index. |



### showColumns
`hiddenColumns.showColumns(columns)`

Shows the provided columns.


| Param | Type | Description |
| --- | --- | --- |
| columns | <code>Array.&lt;number&gt;</code> | Array of visual column indexes. |



### updatePlugin
`hiddenColumns.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



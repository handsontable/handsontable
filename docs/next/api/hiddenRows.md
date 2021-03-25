---
title: HiddenRows
permalink: /next/api/hidden-rows
canonicalUrl: /api/hidden-rows
editLink: false
---

# HiddenRows

[[toc]]

## Description


Plugin allows to hide certain rows. The hiding is achieved by rendering the rows with height set as 0px.
The plugin not modifies the source data and do not participate in data transformation (the shape of data returned
by `getData*` methods stays intact).

Possible plugin settings:
 * `copyPasteEnabled` as `Boolean` (default `true`)
 * `rows` as `Array`
 * `indicators` as `Boolean` (default `false`).

**Example**  
```js
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: getData(),
  hiddenRows: {
    copyPasteEnabled: true,
    indicators: true,
    rows: [1, 2, 5]
  }
});

// access to hiddenRows plugin instance
const hiddenRowsPlugin = hot.getPlugin('hiddenRows');

// show single row
hiddenRowsPlugin.showRow(1);

// show multiple rows
hiddenRowsPlugin.showRow(1, 2, 9);

// or as an array
hiddenRowsPlugin.showRows([1, 2, 9]);

// hide single row
hiddenRowsPlugin.hideRow(1);

// hide multiple rows
hiddenRowsPlugin.hideRow(1, 2, 9);

// or as an array
hiddenRowsPlugin.hideRows([1, 2, 9]);

// rerender the table to see all changes
hot.render();
```

## Methods:

### destroy

_hiddenRows.destroy()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L461)

Destroys the plugin instance.



### disablePlugin

_hiddenRows.disablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L152)

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_hiddenRows.enablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L111)

Enables the plugin functionality for this Handsontable instance.



### getHiddenRows

_hiddenRows.getHiddenRows() ⇒ Array&lt;number&gt;_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L260)

Returns an array of visual indexes of hidden rows.



### hideRow

_hiddenRows.hideRow(...row)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L251)

Hides the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### hideRows

_hiddenRows.hideRows(rows)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L219)

Hides the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array.&lt;number&gt;` | Array of visual row indexes. |



### isEnabled

_hiddenRows.isEnabled() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L104)

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#HiddenRows+enablePlugin) method is called.



### isHidden

_hiddenRows.isHidden(row) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L272)

Checks if the provided row is hidden.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |



### isValidConfig

_hiddenRows.isValidConfig(hiddenRows) ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L282)

Checks whether all of the provided row indexes are within the bounds of the table.


| Param | Type | Description |
| --- | --- | --- |
| hiddenRows | `Array` | List of hidden visual row indexes. |



### showRow

_hiddenRows.showRow(...row)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L210)

Shows the row provided as row index (counting from 0).


| Param | Type | Description |
| --- | --- | --- |
| ...row | `number` | Visual row index. |



### showRows

_hiddenRows.showRows(rows)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L165)

Shows the rows provided in the array.


| Param | Type | Description |
| --- | --- | --- |
| rows | `Array.&lt;number&gt;` | Array of visual row indexes. |



### updatePlugin

_hiddenRows.updatePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/hiddenRows/hiddenRows.js#L142)

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



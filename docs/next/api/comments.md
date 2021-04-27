---
title: Comments
permalink: /next/api/comments
canonicalUrl: /api/comments
editLink: false
---

# Comments

[[toc]]

## Description

This plugin allows setting and managing cell comments by either an option in the context menu or with the use of
the API.

To enable the plugin, you'll need to set the comments property of the config object to `true`:
```js
comments: true
```

or an object with extra predefined plugin config:

```js
comments: {
  displayDelay: 1000
}
```

To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.

**Example**  
```js
const hot = new Handsontable(document.getElementById('example'), {
  data: getData(),
  comments: true,
  cell: [
    {row: 1, col: 1, comment: {value: 'Foo'}},
    {row: 2, col: 2, comment: {value: 'Bar'}}
  ]
});

// Access to the Comments plugin instance:
const commentsPlugin = hot.getPlugin('comments');

// Manage comments programmatically:
commentsPlugin.setCommentAtCell(1, 6, 'Comment contents');
commentsPlugin.showAtCell(1, 6);
commentsPlugin.removeCommentAtCell(1, 6);

// You can also set range once and use proper methods:
commentsPlugin.setRange({from: {row: 1, col: 6}});
commentsPlugin.setComment('Comment contents');
commentsPlugin.show();
commentsPlugin.removeComment();
```

## Members

### range
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L118

:::

`comments.range : object`

Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).


## Methods

### clearRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L234

:::

`comments.clearRange()`

Clears the currently selected cell.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L854

:::

`comments.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L200

:::

`comments.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L154

:::

`comments.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### getComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L339

:::

`comments.getComment() ⇒ string | undefined`

Gets comment from a cell according to previously set range (see [setRange](#Comments+setRange)).


**Returns**: `string` | `undefined` - Returns a content of the comment.  

### getCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L353

:::

`comments.getCommentAtCell(row, column) ⇒ string | undefined`

Gets comment from a cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `string` | `undefined` - Returns a content of the comment.  

### getCommentMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L537

:::

`comments.getCommentMeta(row, column, property) ⇒ Mixed`

Gets the comment related meta information.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| property | `string` | Cell meta property. |



### hide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L404

:::

`comments.hide()`

Hides the comment editor.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L147

:::

`comments.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#Comments+enablePlugin) method is called.



### refreshEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L415

:::

`comments.refreshEditor([force])`

Refreshes comment editor position and styling.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` If `true` then recalculation will be forced. |



### removeComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L306

:::

`comments.removeComment([forceRender])`

Removes a comment from a cell according to previously set range (see [setRange](#Comments+setRange)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceRender] | `boolean` | <code>true</code> | `optional` If set to `true`, the table will be re-rendered at the end of the operation. |



### removeCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L327

:::

`comments.removeCommentAtCell(row, column, [forceRender])`

Removes a comment from a specified cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [forceRender] | `boolean` | <code>true</code> | `optional` If `true`, the table will be re-rendered at the end of the operation. |



### setComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L267

:::

`comments.setComment(value)`

Sets a comment for a cell according to the previously set range (see [setRange](#Comments+setRange)).


| Param | Type | Description |
| --- | --- | --- |
| value | `string` | Comment contents. |



### setCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L294

:::

`comments.setCommentAtCell(row, column, value)`

Sets a comment for a specified cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| value | `string` | Comment contents. |



### setRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L227

:::

`comments.setRange(range)`

Sets the current cell range to be able to use general methods like [setComment](#Comments+setComment), [removeComment](#Comments+removeComment), [show](#Comments+show).


| Param | Type | Description |
| --- | --- | --- |
| range | `object` | Object with `from` property, each with `row` and `col` properties. |



### show
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L362

:::

`comments.show() ⇒ boolean`

Shows the comment editor accordingly to the previously set range (see [setRange](#Comments+setRange)).


**Returns**: `boolean` - Returns `true` if comment editor was shown.  

### showAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L393

:::

`comments.showAtCell(row, column) ⇒ boolean`

Shows comment editor according to cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `boolean` - Returns `true` if comment editor was shown.  

### updateCommentMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L515

:::

`comments.updateCommentMeta(row, column, metaObject)`

Sets or update the comment-related cell meta.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| metaObject | `object` | Object defining all the comment-related meta information. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/comments/comments.js#L189

:::

`comments.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



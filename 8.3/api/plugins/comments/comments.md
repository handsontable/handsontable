---
title: Comments
permalink: /8.3/api/comments
---

# {{ $frontmatter.title }}

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
`comments.range : object`

Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).



### isEnabled
`comments.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#Comments+enablePlugin) method is called.



### enablePlugin
`comments.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`comments.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`comments.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### setRange
`comments.setRange(range)`

Sets the current cell range to be able to use general methods like [setComment](#Comments+setComment), [removeComment](#Comments+removeComment), [show](#Comments+show).


| Param | Type | Description |
| --- | --- | --- |
| range | <code>object</code> | Object with `from` property, each with `row` and `col` properties. |



### clearRange
`comments.clearRange()`

Clears the currently selected cell.



### setComment
`comments.setComment(value)`

Sets a comment for a cell according to the previously set range (see [setRange](#Comments+setRange)).


| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | Comment contents. |



### setCommentAtCell
`comments.setCommentAtCell(row, column, value)`

Sets a comment for a specified cell.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| value | <code>string</code> | Comment contents. |



### removeComment
`comments.removeComment([forceRender])`

Removes a comment from a cell according to previously set range (see [setRange](#Comments+setRange)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceRender] | <code>boolean</code> | <code>true</code> | `optional` If set to `true`, the table will be re-rendered at the end of the operation. |



### removeCommentAtCell
`comments.removeCommentAtCell(row, column, [forceRender])`

Removes a comment from a specified cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | <code>number</code> |  | Visual row index. |
| column | <code>number</code> |  | Visual column index. |
| [forceRender] | <code>boolean</code> | <code>true</code> | `optional` If `true`, the table will be re-rendered at the end of the operation. |



### getComment
`comments.getComment() ⇒ string | undefined`

Gets comment from a cell according to previously set range (see [setRange](#Comments+setRange)).


**Returns**: <code>string</code> \| <code>undefined</code> - Returns a content of the comment.  

### getCommentAtCell
`comments.getCommentAtCell(row, column) ⇒ string | undefined`

Gets comment from a cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |


**Returns**: <code>string</code> \| <code>undefined</code> - Returns a content of the comment.  

### show
`comments.show() ⇒ boolean`

Shows the comment editor accordingly to the previously set range (see [setRange](#Comments+setRange)).


**Returns**: <code>boolean</code> - Returns `true` if comment editor was shown.  

### showAtCell
`comments.showAtCell(row, column) ⇒ boolean`

Shows comment editor according to cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |


**Returns**: <code>boolean</code> - Returns `true` if comment editor was shown.  

### hide
`comments.hide()`

Hides the comment editor.



### refreshEditor
`comments.refreshEditor([force])`

Refreshes comment editor position and styling.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | <code>boolean</code> | <code>false</code> | `optional` If `true` then recalculation will be forced. |



### updateCommentMeta
`comments.updateCommentMeta(row, column, metaObject)`

Sets or update the comment-related cell meta.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| metaObject | <code>object</code> | Object defining all the comment-related meta information. |



### getCommentMeta
`comments.getCommentMeta(row, column, property) ⇒ Mixed`

Gets the comment related meta information.


| Param | Type | Description |
| --- | --- | --- |
| row | <code>number</code> | Visual row index. |
| column | <code>number</code> | Visual column index. |
| property | <code>string</code> | Cell meta property. |



### destroy
`comments.destroy()`

Destroys the plugin instance.




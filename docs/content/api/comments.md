---
title: Comments
metaTitle: Comments - JavaScript Data Grid | Handsontable
permalink: /api/comments
canonicalUrl: /api/comments
searchCategory: API Reference
hotPlugin: true
editLink: false
id: 4sp9dfou
description: Use the Comments plugin with its API options, members, and methods to set and manage cell comments through the context menu or the API.
react:
  id: 3g0bkzza
  metaTitle: Comments - React Data Grid | Handsontable
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
  displayDelay: 1000,
  readOnly: true,
  style: {
    width: 300,
    height: 100
  }
}
```

To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.

**Example**  
::: only-for javascript
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
:::

::: only-for react
```jsx
const hotRef = useRef(null);

...

<HotTable
  ref={hotRef}
  data={getData()}
  comments={true}
  cell={[
    {row: 1, col: 1, comment: {value: 'Foo'}},
    {row: 2, col: 2, comment: {value: 'Bar'}}
  ]}
/>

// Access to the Comments plugin instance:
const hot = hotRef.current.hotInstance;
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
:::

## Options

### comments
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/dataMap/metaManager/metaSchema.js#L1095

:::

_comments.comments : boolean | Array&lt;object&gt;_

The `comments` option configures the [`Comments`](@/api/comments.md) plugin.

You can set the `comments` option to one of the following:

| Setting   | Description                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`    | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)                                 |
| `false`   | Disable the [`Comments`](@/api/comments.md) plugin                                                                                                                                    |
| An object | - Enable the [`Comments`](@/api/comments.md) plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)<br>- Configure comment settings |

If you set the `comments` option to an object, you can configure the following comment options:

| Option         | Possible settings           | Description                                         |
| -------------- | --------------------------- | --------------------------------------------------- |
| `displayDelay` | A number (default: `250`)   | Display comments after a delay (in milliseconds)    |
| `readOnly`     | `true` \| `false` (default) | `true`: Make comments read-only                     |
| `style`        | An object                   | Set comment boxes' `width` and `height` (in pixels) |

Read more:
- [Comments](@/guides/cell-features/comments/comments.md)
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [`width`](#width)
- [`height`](#height)
- [`readOnly`](#readonly)
- [`commentedCellClassName`](#commentedcellclassname)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `Comments` plugin
comments: true,

// enable the `Comments` plugin
// and configure its settings
comments: {
  // display all comments with a 1-second delay
  displayDelay: 1000,
  // make all comments read-only
  readOnly: true,
  // set the default size of all comment boxes
  style: {
    width: 300,
    height: 100
  }
}
```

## Members

### range
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L138

:::

_comments.range : object_

Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).


## Methods

### clearRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L338

:::

_comments.clearRange()_

Clears the currently selected cell.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L807

:::

_comments.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L240

:::

_comments.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L196

:::

_comments.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### focusEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L604

:::

_comments.focusEditor()_

Focuses the comments editor element.



### getComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L443

:::

_comments.getComment() ⇒ string | undefined_

Gets comment from a cell according to previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


**Returns**: `string` | `undefined` - Returns a content of the comment.  

### getCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L457

:::

_comments.getCommentAtCell(row, column) ⇒ string | undefined_

Gets comment from a cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `string` | `undefined` - Returns a content of the comment.  

### getCommentMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L637

:::

_comments.getCommentMeta(row, column, property) ⇒ Mixed_

Gets the comment related meta information.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| property | `string` | Cell meta property. |



### hide
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L505

:::

_comments.hide()_

Hides the comment editor.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L189

:::

_comments.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Comments#enablePlugin](@/api/comments.md#enableplugin) method is called.



### refreshEditor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L514

:::

_comments.refreshEditor([force])_

Refreshes comment editor position and styling.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` If `true` then recalculation will be forced. |



### removeComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L410

:::

_comments.removeComment([forceRender])_

Removes a comment from a cell according to previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceRender] | `boolean` | <code>true</code> | `optional` If set to `true`, the table will be re-rendered at the end of the operation. |



### removeCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L431

:::

_comments.removeCommentAtCell(row, column, [forceRender])_

Removes a comment from a specified cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [forceRender] | `boolean` | <code>true</code> | `optional` If `true`, the table will be re-rendered at the end of the operation. |



### setComment
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L371

:::

_comments.setComment(value)_

Sets a comment for a cell according to the previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


| Param | Type | Description |
| --- | --- | --- |
| value | `string` | Comment contents. |



### setCommentAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L398

:::

_comments.setCommentAtCell(row, column, value)_

Sets a comment for a specified cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| value | `string` | Comment contents. |



### setRange
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L331

:::

_comments.setRange(range)_

Sets the current cell range to be able to use general methods like [Comments#setComment](@/api/comments.md#setcomment), [Comments#removeComment](@/api/comments.md#removecomment), [Comments#show](@/api/comments.md#show).


| Param | Type | Description |
| --- | --- | --- |
| range | `object` | Object with `from` property, each with `row` and `col` properties. |



### show
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L466

:::

_comments.show() ⇒ boolean_

Shows the comment editor accordingly to the previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


**Returns**: `boolean` - Returns `true` if comment editor was shown.  

### showAtCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L494

:::

_comments.showAtCell(row, column) ⇒ boolean_

Shows comment editor according to cell coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `boolean` - Returns `true` if comment editor was shown.  

### updateCommentMeta
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L615

:::

_comments.updateCommentMeta(row, column, metaObject)_

Sets or update the comment-related cell meta.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| metaObject | `object` | Object defining all the comment-related meta information. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/plugins/comments/comments.js#L232

:::

_comments.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
  - [`comments`](@/api/options.md#comments)



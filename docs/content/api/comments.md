---
title: Comments
metaTitle: Comments | Handsontable DataGrid for JavaScript
permalink: /api/comments
canonicalUrl: /api/comments
searchCategory: API Reference
hotPlugin: false
editLink: false
id: 4sp9dfou
description: Use the Comments plugin with its API options, members, and methods to set and manage cell comments through the context menu or the API.
react:
  id: 3g0bkzza
  metaTitle: Comments | Handsontable DataGrid for React
angular:
  id: k5d0m8mn
  metaTitle: Comments | Handsontable DataGrid for Angular
---

[[toc]]

See the [Comments](@/guides/cell-features/comments/comments.md) guide for examples and configuration details.

## Options

### comments
<p class="tag-config-scope-list"><span class="tag-config-scope-label">Can be set at:</span> <span class="tag-config-scope">grid</span></p>

::: ask-about-api comments|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1682

:::

_comments.comments : boolean | Array&lt;object&gt;_

The `comments` option configures the `Comments` plugin.

You can set the `comments` option to one of the following:

| Setting   | Description                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true`    | - Enable the `Comments` plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)                                 |
| `false`   | Disable the `Comments` plugin                                                                                                                                    |
| An object | - Enable the `Comments` plugin<br>- Add comment menu items to the [context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)<br>- Configure comment settings |

If you set the `comments` option to an object, you can configure the following comment options:

| Option         | Possible settings           | Description                                         |
| -------------- | --------------------------- | --------------------------------------------------- |
| `displayDelay` | A number (default: `250`)   | Display comments after a delay (in milliseconds)    |
| `readOnly`     | `true` \| `false` (default) | `true`: Make comments read-only                     |
| `style`        | An object                   | Set comment boxes' `width` and `height` (in pixels) |

Read more:
- [Comments](@/guides/cell-features/comments/comments.md)
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [`width`](@/api/options.md#width)
- [`height`](@/api/options.md#height)
- [`readOnly`](@/api/options.md#readonly)
- [`commentedCellClassName`](@/api/options.md#commentedcellclassname)

This option can only be set at the [grid level](@/guides/configuration/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

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

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L290

:::

_Comments.DEFAULT\_SETTINGS_

Returns the default settings applied when the plugin is enabled without explicit configuration.



### LICENSE

::: ask-about-api LICENSE|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L285

:::

_Comments.LICENSE_

Returns the license token of the plugin, its display name, where it is checked, and the tokens it
requires.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L274

:::

_Comments.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L279

:::

_Comments.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### range

::: ask-about-api range|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L929

:::

_comments.range : object_

Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).


## Methods

### clearRange

::: ask-about-api clearRange|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L532

:::

_comments.clearRange()_

Clears the currently selected cell.



### destroy

::: ask-about-api destroy|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L862

:::

_comments.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L354

:::

_comments.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L305

:::

_comments.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### focusEditor

::: ask-about-api focusEditor|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L805

:::

_comments.focusEditor()_

Focuses the comments editor element.



### getComment

::: ask-about-api getComment|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L623

:::

_comments.getComment() ⇒ string | undefined_

Gets comment from a cell according to previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


**Returns**: `string` | `undefined` - Returns a content of the comment, or `undefined` if the cell has no comment
or the range points at a header.  

### getCommentAtCell

::: ask-about-api getCommentAtCell|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L634

:::

_comments.getCommentAtCell(row, column) ⇒ string | undefined_

Gets comment from a cell at the provided coordinates.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `string` | `undefined` - Returns a content of the comment, or `undefined` if the cell has no comment
or the coordinates point at a header (a negative index).  

### getCommentMeta

::: ask-about-api getCommentMeta|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L819

:::

_comments.getCommentMeta()_

Returns the value of a specific meta property from the comment attached to the given cell.



### hide

::: ask-about-api hide|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L677

:::

_comments.hide()_

Hides the comment editor.



### isEnabled

::: ask-about-api isEnabled|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L300

:::

_comments.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [Comments#enablePlugin](@/api/comments.md#enableplugin) method is called.



### refreshEditor

::: ask-about-api refreshEditor|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L684

:::

_comments.refreshEditor([force])_

Refreshes comment editor position and styling.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [force] | `boolean` | <code>false</code> | `optional` If `true` then recalculation will be forced. |



### removeComment

::: ask-about-api removeComment|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L595

:::

_comments.removeComment([forceRender])_

Removes a comment from a cell according to previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [forceRender] | `boolean` | <code>true</code> | `optional` If set to `true`, the table will be re-rendered at the end of the operation. |



### removeCommentAtCell

::: ask-about-api removeCommentAtCell|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L612

:::

_comments.removeCommentAtCell(row, column, [forceRender])_

Removes a comment from a specified cell.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| row | `number` |  | Visual row index. |
| column | `number` |  | Visual column index. |
| [forceRender] | `boolean` | <code>true</code> | `optional` If `true`, the table will be re-rendered at the end of the operation. |



### setComment

::: ask-about-api setComment|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L562

:::

_comments.setComment(value)_

Sets a comment for a cell according to the previously set range (see [Comments#setRange](@/api/comments.md#setrange)).


| Param | Type | Description |
| --- | --- | --- |
| value | `string` | Comment contents. |



### setCommentAtCell

::: ask-about-api setCommentAtCell|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L585

:::

_comments.setCommentAtCell(row, column, value)_

Sets a comment for a specified cell.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| value | `string` | Comment contents. |



### setRange

::: ask-about-api setRange|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L527

:::

_comments.setRange(range)_

Sets the current cell range to be able to use general methods like [Comments#setComment](@/api/comments.md#setcomment), [Comments#removeComment](@/api/comments.md#removecomment), [Comments#show](@/api/comments.md#show).


| Param | Type | Description |
| --- | --- | --- |
| range | `object` | Object with `from` property, each with `row` and `col` properties. |



### show

::: ask-about-api show|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L644

:::

_comments.show() ⇒ boolean_

Shows the comment editor accordingly to the previously set range (see [Comments#setRange](@/api/comments.md#setrange)).

The editor opens even if the cell has no comment. In that case, it is empty, so you can add a comment.
To check first, use [Comments#getCommentAtCell](@/api/comments.md#getcommentatcell).


**Returns**: `boolean` - Returns `true` if comment editor was shown. Returns `false` if the cell is outside the grid.  

### showAtCell

::: ask-about-api showAtCell|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L669

:::

_comments.showAtCell(row, column) ⇒ boolean_

Shows comment editor according to cell coordinates.

The editor opens even if the cell has no comment. In that case, it is empty, so you can add a comment.
To check first, use [Comments#getCommentAtCell](@/api/comments.md#getcommentatcell).


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |


**Returns**: `boolean` - Returns `true` if comment editor was shown. Returns `false` if the cell is outside the grid.  

### updateCommentMeta

::: ask-about-api updateCommentMeta|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L814

:::

_comments.updateCommentMeta(row, column, metaObject)_

Sets or update the comment-related cell meta.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Visual row index. |
| column | `number` | Visual column index. |
| metaObject | `object` | Object defining all the comment-related meta information. |



### updatePlugin

::: ask-about-api updatePlugin|Comments

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/comments/comments.ts#L348

:::

_comments.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
  - [`comments`](@/api/options.md#comments)



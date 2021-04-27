---
title: ContextMenu
permalink: /next/api/context-menu
canonicalUrl: /api/context-menu
editLink: false
---

# ContextMenu

[[toc]]

## Description

This plugin creates the Handsontable Context Menu. It allows to create a new row or column at any place in the
grid among [other features](https://handsontable.com/docs/demo-context-menu.html).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely)
* `{ uiContainer: containerDomElement }` (to declare a container for all of the Context Menu's dom elements to be placed in).

or array of any available strings:
* `'row_above'`
* `'row_below'`
* `'col_left'`
* `'col_right'`
* `'remove_row'`
* `'remove_col'`
* `'undo'`
* `'redo'`
* `'make_read_only'`
* `'alignment'`
* `'---------'` (menu item separator)
* `'borders'` (with [Options#customBorders](./Options/#customBorders) turned on)
* `'commentsAddEdit'` (with [Options#comments](./Options/#comments) turned on)
* `'commentsRemove'` (with [Options#comments](./Options/#comments) turned on).

See [the context menu demo](https://handsontable.com/docs/demo-context-menu.html) for examples.

**Example**  
```js
// as a boolean
contextMenu: true
// as a array
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo']
```

## Options

### allowInsertColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L699

:::

`contextMenu.allowInsertColumn : boolean`

If set to `false`, there won't be an option to insert new columns in the Context Menu.

**Default**: <code>true</code>  
**Category**: ContextMenu  
**Example**  
```js
// hide "Insert column left" and "Insert column right" options from the Context Menu
allowInsertColumn: false,
```


### allowInsertRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L683

:::

`contextMenu.allowInsertRow : boolean`

If set to `false`, there won't be an option to insert new rows in the Context Menu.

**Default**: <code>true</code>  
**Category**: ContextMenu  
**Example**  
```js
// hide "Insert row above" and "Insert row below" options from the Context Menu
allowInsertRow: false,
```


### allowRemoveColumn
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L731

:::

`contextMenu.allowRemoveColumn : boolean`

If set to `false`, there won't be an option to remove columns in the Context Menu.

**Default**: <code>true</code>  
**Category**: ContextMenu  
**Example**  
```js
// hide "Remove column" option from the Context Menu
allowRemoveColumn: false,
```


### allowRemoveRow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L715

:::

`contextMenu.allowRemoveRow : boolean`

If set to `false`, there won't be an option to remove rows in the Context Menu.

**Default**: <code>true</code>  
**Category**: ContextMenu  
**Example**  
```js
// hide "Remove row" option from the Context Menu
allowRemoveRow: false,
```


### contextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/dataMap/metaManager/metaSchema.js#L1774

:::

`contextMenu.contextMenu : boolean | Array<string> | object`

Defines if the right-click context menu should be enabled. Context menu allows to create new row or column at any
place in the grid among [other features](https://docs.handsontable.com/demo-context-menu.html).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely)
* an array of [predefined options](https://docs.handsontable.com/demo-context-menu.html#page-specific),
* an object [with defined structure](https://docs.handsontable.com/demo-context-menu.html#page-custom).

If the value is an object, you can also customize the options with:
* `disableSelection` - a `boolean`, if set to true it prevents mouseover from highlighting the item for selection
* `isCommand` - a `boolean`, if set to false it prevents clicks from executing the command and closing the menu.

See [the context menu demo](https://docs.handsontable.com/demo-context-menu.html) for examples.

**Default**: <code>undefined</code>  
**Category**: ContextMenu  
**Example**  
```js
// as a boolean
contextMenu: true,

// as an array
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],

// as an object (`name` attribute is required in the custom keys)
contextMenu: {
  items: {
    "option1": {
      name: "option1"
    },
    "option2": {
      name: "option2",
      submenu: {
        items: [
          {
            key: "option2:suboption1",
            name: "option2:suboption1",
            callback: function(key, options) {
              ...
            }
          },
          ...
        ]
      }
    }
  }
},
```

## Members

### DEFAULT_ITEMS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L94

:::

`ContextMenu.DEFAULT\_ITEMS ⇒ Array<string>`

Context menu default items order when `contextMenu` options is set as `true`.


## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L246

:::

`contextMenu.close()`

Closes the menu.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L386

:::

`contextMenu.destroy()`

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L195

:::

`contextMenu.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L155

:::

`contextMenu.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L281

:::

`contextMenu.executeCommand(commandName, ...params)`

Execute context menu command.

You can execute all predefined commands:
 * `'row_above'` - Insert row above
 * `'row_below'` - Insert row below
 * `'col_left'` - Insert column left
 * `'col_right'` - Insert column right
 * `'clear_column'` - Clear selected column
 * `'remove_row'` - Remove row
 * `'remove_col'` - Remove column
 * `'undo'` - Undo last action
 * `'redo'` - Redo last action
 * `'make_read_only'` - Make cell read only
 * `'alignment:left'` - Alignment to the left
 * `'alignment:top'` - Alignment to the top
 * `'alignment:right'` - Alignment to the right
 * `'alignment:bottom'` - Alignment to the bottom
 * `'alignment:middle'` - Alignment to the middle
 * `'alignment:center'` - Alignment to the center (justify).

Or you can execute command registered in settings where `key` is your command name.


| Param | Type | Description |
| --- | --- | --- |
| commandName | `string` | The command name to be executed. |
| ...params | `\*` | Additional paramteres passed to command executor module. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L148

:::

`contextMenu.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ContextMenu+enablePlugin) method is called.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L210

:::

`contextMenu.open(event)`

Opens menu and re-position it based on the passed coordinates.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The mouse event object. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/develop/src/plugins/contextMenu/contextMenu.js#L185

:::

`contextMenu.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



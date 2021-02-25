---
title: ContextMenu
permalink: /8.2/api/context-menu
---

# {{ $frontmatter.title }}

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
* `'borders'` (with [Options#customBorders](Options#customBorders) turned on)
* `'commentsAddEdit'` (with [Options#comments](Options#comments) turned on)
* `'commentsRemove'` (with [Options#comments](Options#comments) turned on).

See [the context menu demo](https://handsontable.com/docs/demo-context-menu.html) for examples.


**Example**  
```js
// as a boolean
contextMenu: true
// as a array
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo']
```

## Members
### isEnabled
`contextMenu.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#ContextMenu+enablePlugin) method is called.



### enablePlugin
`contextMenu.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### updatePlugin
`contextMenu.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`contextMenu.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### open
`contextMenu.open(event)`

Opens menu and re-position it based on the passed coordinates.


| Param | Type | Description |
| --- | --- | --- |
| event | <code>Event</code> | The mouse event object. |



### close
`contextMenu.close()`

Closes the menu.



### executeCommand
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
| commandName | <code>string</code> | The command name to be executed. |
| ...params | <code>\*</code> | Additional paramteres passed to command executor module. |



### destroy
`contextMenu.destroy()`

Destroys the plugin instance.



### DEFAULT_ITEMS
`ContextMenu.DEFAULT\_ITEMS ⇒ Array.<string>`

Context menu default items order when `contextMenu` options is set as `true`.




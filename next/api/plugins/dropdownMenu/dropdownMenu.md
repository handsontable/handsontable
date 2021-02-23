---
title: DropdownMenu
permalink: /next/api/dropdown-menu
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin creates the Handsontable Dropdown Menu. It allows to create a new row or column at any place in the grid
among [other features](https://handsontable.com/docs/demo-context-menu.html).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely).

or array of any available strings:
* `["row_above", "row_below", "col_left", "col_right",
"remove_row", "remove_col", "---------", "undo", "redo"]`.

See [the dropdown menu demo](https://handsontable.com/docs/demo-dropdown-menu.html) for examples.


**Example**  
```
const container = document.getElementById('example');
const hot = new Handsontable(container, {
  data: data,
  colHeaders: true,
  // enable dropdown menu
  dropdownMenu: true
});

// or
const hot = new Handsontable(container, {
  data: data,
  colHeaders: true,
  // enable and configure dropdown menu
  dropdownMenu: ['remove_col', '---------', 'make_read_only', 'alignment']
});
```

## Members
### isEnabled
`dropdownMenu.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#DropdownMenu+enablePlugin) method is called.



### enablePlugin
`dropdownMenu.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.

**Emits**: <code>Hooks#event:afterDropdownMenuDefaultOptions</code>, <code>Hooks#event:beforeDropdownMenuSetItems</code>  


### updatePlugin
`dropdownMenu.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### disablePlugin
`dropdownMenu.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### open
`dropdownMenu.open(position)`

Opens menu and re-position it based on the passed coordinates.

**Emits**: <code>Hooks#event:beforeDropdownMenuShow</code>, <code>Hooks#event:afterDropdownMenuShow</code>  

| Param | Type | Description |
| --- | --- | --- |
| position | <code>object</code> \| <code>Event</code> | An object with `pageX` and `pageY` properties which contains values relative to                                the top left of the fully rendered content area in the browser or with `clientX`                                and `clientY`  properties which contains values relative to the upper left edge                                of the content area (the viewport) of the browser window. This object is structurally                                compatible with native mouse event so it can be used either. |



### close
`dropdownMenu.close()`

Closes dropdown menu.



### executeCommand
`dropdownMenu.executeCommand(commandName, ...params)`

Executes context menu command.

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
| commandName | <code>string</code> | Command name to execute. |
| ...params | <code>\*</code> | Additional parameters passed to the command executor. |



### destroy
`dropdownMenu.destroy()`

Destroys the plugin instance.



### DEFAULT_ITEMS
`DropdownMenu.DEFAULT\_ITEMS ⇒ Array`

Default menu items order when `dropdownMenu` is enabled by setting the config item to `true`.




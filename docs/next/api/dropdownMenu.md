---
title: DropdownMenu
permalink: /next/api/dropdown-menu
canonicalUrl: /api/dropdown-menu
editLink: false
---

# DropdownMenu

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

## Members:

### DEFAULT_ITEMS

_DropdownMenu.DEFAULT\_ITEMS ⇒ Array_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L89)

Default menu items order when `dropdownMenu` is enabled by setting the config item to `true`.


## Methods:

### close

_dropdownMenu.close()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L257)

Closes dropdown menu.



### destroy

_dropdownMenu.destroy()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L423)

Destroys the plugin instance.



### disablePlugin

_dropdownMenu.disablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L212)

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_dropdownMenu.enablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L155)

Enables the plugin functionality for this Handsontable instance.

**Emits**: <code>Hooks#event:afterDropdownMenuDefaultOptions</code>, <code>Hooks#event:beforeDropdownMenuSetItems</code>  


### executeCommand

_dropdownMenu.executeCommand(commandName, ...params)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L290)

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
| commandName | `string` | Command name to execute. |
| ...params | `\*` | Additional parameters passed to the command executor. |



### isEnabled

_dropdownMenu.isEnabled() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L145)

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](./Hooks/#beforeInit)
hook and if it returns `true` than the [enablePlugin](#DropdownMenu+enablePlugin) method is called.



### open

_dropdownMenu.open(position)_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L242)

Opens menu and re-position it based on the passed coordinates.

**Emits**: <code>Hooks#event:beforeDropdownMenuShow</code>, <code>Hooks#event:afterDropdownMenuShow</code>  

| Param | Type | Description |
| --- | --- | --- |
| position | `object` \| `Event` | An object with `pageX` and `pageY` properties which contains values relative to                                the top left of the fully rendered content area in the browser or with `clientX`                                and `clientY`  properties which contains values relative to the upper left edge                                of the content area (the viewport) of the browser window. This object is structurally                                compatible with native mouse event so it can be used either. |



### updatePlugin

_dropdownMenu.updatePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/dropdownMenu/dropdownMenu.js#L203)

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



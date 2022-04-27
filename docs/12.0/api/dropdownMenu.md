---
title: DropdownMenu
metaTitle: DropdownMenu - Plugin - Handsontable Documentation
permalink: /12.0/api/dropdown-menu
canonicalUrl: /api/dropdown-menu
hotPlugin: true
editLink: false
---

# DropdownMenu

[[toc]]

## Description

This plugin creates the Handsontable Dropdown Menu. It allows to create a new row or column at any place in the grid
among [other features](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely).

or array of any available strings:
* `["row_above", "row_below", "col_left", "col_right",
"remove_row", "remove_col", "---------", "undo", "redo"]`.

See [the dropdown menu demo](@/guides/columns/column-menu.md) for examples.

**Example**  
```js
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

## Options

### dropdownMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/dataMap/metaManager/metaSchema.js#L1705

:::

_dropdownMenu.dropdownMenu : boolean | object | Array&lt;string&gt;_

The `dropdownMenu` option configures the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

You can set the `dropdownMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin                                                                                                                                   |
| `true`    | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu.md#context-menu-with-default-options)    |
| An array  | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options) |
| An object | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Apply a custom dropdown menu configuration                                                                                  |

Read more:
- [Context menu &#8594;](@/guides/accessories-and-menus/context-menu.md)
- [Plugins: `DropdownMenu` &#8594;](@/api/dropdownMenu.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `DropdownMenu` plugin
// use the default context menu options
dropdownMenu: true,

// enable the `DropdownMenu` plugin
// and modify individual context menu options
dropdownMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],

// enable the `DropdownMenu` plugin
// and apply a custom dropdown menu configuration
dropdownMenu: {
  items: {
    'option1': {
      name: 'option1'
    },
    'option2': {
      name: 'option2',
      submenu: {
        items: [
          {
            key: 'option2:suboption1',
            name: 'option2:suboption1',
            callback(key, options) {
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L89

:::

_DropdownMenu.DEFAULT\_ITEMS ⇒ Array_

Default menu items order when `dropdownMenu` is enabled by setting the config item to `true`.


## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L258

:::

_dropdownMenu.close()_

Closes dropdown menu.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L425

:::

_dropdownMenu.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L213

:::

_dropdownMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L155

:::

_dropdownMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.

**Emits**: [`Hooks#event:afterDropdownMenuDefaultOptions`](@/api/hooks.md#afterdropdownmenudefaultoptions), [`Hooks#event:beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems)  


### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L291

:::

_dropdownMenu.executeCommand(commandName, ...params)_

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
| ...params | `*` | Additional parameters passed to the command executor. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L145

:::

_dropdownMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [DropdownMenu#enablePlugin](@/api/dropdownMenu.md#enableplugin) method is called.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L243

:::

_dropdownMenu.open(position)_

Opens menu and re-position it based on the passed coordinates.

**Emits**: [`Hooks#event:beforeDropdownMenuShow`](@/api/hooks.md#beforedropdownmenushow), [`Hooks#event:afterDropdownMenuShow`](@/api/hooks.md#afterdropdownmenushow)  

| Param | Type | Description |
| --- | --- | --- |
| position | `object` <br/> `Event` | An object with `pageX` and `pageY` properties which contains values relative to                                the top left of the fully rendered content area in the browser or with `clientX`                                and `clientY`  properties which contains values relative to the upper left edge                                of the content area (the viewport) of the browser window. This object is structurally                                compatible with native mouse event so it can be used either. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/92725e660e6a9b7df7b6d889aeab2022cbf4b4a7/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L204

:::

_dropdownMenu.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



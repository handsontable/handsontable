---
title: DropdownMenu
metaTitle: DropdownMenu - JavaScript Data Grid | Handsontable
permalink: /api/dropdown-menu
canonicalUrl: /api/dropdown-menu
searchCategory: API Reference
hotPlugin: false
editLink: false
id: snqjcwml
description: Use the DropdownMenu plugin with its API options, members, and methods to enable and customize an interactive column menu.
react:
  id: zj3aru0b
  metaTitle: DropdownMenu - React Data Grid | Handsontable
angular:
  id: p4i5r3wx
  metaTitle: DropdownMenu - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the plugin and registers the column header hook needed to inject the dropdown button.


## Options

### dropdownMenu

::: ask-about-api dropdownMenu|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L2350

:::

_dropdownMenu.dropdownMenu : boolean | object | Array&lt;string&gt;_

The `dropdownMenu` option configures the `DropdownMenu` plugin.

You can set the `dropdownMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the `DropdownMenu` plugin                                                                                                                                   |
| `true`    | - Enable the `DropdownMenu` plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)    |
| An array  | - Enable the `DropdownMenu` plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options) |
| An object | - Enable the `DropdownMenu` plugin<br>- Apply a custom dropdown menu configuration                                                                                  |

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It is not possible to show or hide the dropdown menu icon for individual columns using this option.

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `DropdownMenu` plugin
// use the default context menu options
dropdownMenu: true,

// enable the `DropdownMenu` plugin
// and modify individual context menu options
dropdownMenu: ['---------', 'undo', 'redo'],

// enable the `DropdownMenu` plugin
// and apply a custom dropdown menu configuration
dropdownMenu: {
  items: {
    'option1': {
      name: 'Option 1'
    },
    'option2': {
      name: 'Option 2',
      submenu: {
        items: [
          {
            key: 'option2:suboption1',
            name: 'Suboption 1',
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

::: ask-about-api DEFAULT_ITEMS|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L171

:::

_DropdownMenu.DEFAULT\_ITEMS ⇒ Array_

Default menu items order when `dropdownMenu` is enabled by setting the config item to `true`.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L162

:::

_DropdownMenu.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L152

:::

_DropdownMenu.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L157

:::

_DropdownMenu.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### close

::: ask-about-api close|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L448

:::

_dropdownMenu.close()_

Closes dropdown menu.



### destroy

::: ask-about-api destroy|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L497

:::

_dropdownMenu.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L254

:::

_dropdownMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L198

:::

_dropdownMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.

**Emits**: [`Hooks#event:afterDropdownMenuDefaultOptions`](@/api/hooks.md#afterdropdownmenudefaultoptions), [`Hooks#event:beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems)  


### executeCommand

::: ask-about-api executeCommand|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L477

:::

_dropdownMenu.executeCommand(commandName, ...params)_

Executes context menu command.

The `executeCommand()` method works only for selected cells.

When no cells are selected, `executeCommand()` doesn't do anything.

You can execute all predefined commands:
 * `'col_left'` - Insert column left
 * `'col_right'` - Insert column right
 * `'clear_column'` - Clear selected column
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

::: ask-about-api isEnabled|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L190

:::

_dropdownMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [DropdownMenu#enablePlugin](@/api/dropdownMenu.md#enableplugin) method is called.



### open

::: ask-about-api open|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L427

:::

_dropdownMenu.open(position, offset, [anchorRectProvider])_

Opens the menu and positions it based on the passed coordinates.

**Emits**: [`Hooks#event:beforeDropdownMenuShow`](@/api/hooks.md#beforedropdownmenushow), [`Hooks#event:afterDropdownMenuShow`](@/api/hooks.md#afterdropdownmenushow)  
**Example**  
```js
const menu = hot.getPlugin('dropdownMenu');

hot.selectCell(0, 0);
menu.open({ top: 50, left: 50 });
```

| Param | Type | Description |
| --- | --- | --- |
| position | `Object` <br/> `Event` | An object with `top` and `left` properties (coordinates relative to the browser viewport, without scroll offsets), or a native browser `Event` instance (e.g., a `MouseEvent`). |
| offset | `Object` | An object that applies an offset to the menu position. |
| [anchorRectProvider] | `function` | `optional` Returns the current anchor rectangle for scroll-follow repositioning, or `null` when the anchor is no longer rendered. |



### updatePlugin

::: ask-about-api updatePlugin|DropdownMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/dropdownMenu/dropdownMenu.ts#L247

:::

_dropdownMenu.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`dropdownMenu`](@/api/options.md#dropdownmenu)



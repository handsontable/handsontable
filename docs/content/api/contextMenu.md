---
title: ContextMenu
metaTitle: ContextMenu - JavaScript Data Grid | Handsontable
permalink: /api/context-menu
canonicalUrl: /api/context-menu
searchCategory: API Reference
hotPlugin: true
editLink: false
id: pczrlicw
description: Use the ContextMenu plugin with its API options, members, and methods to enable and customize the context menu.
react:
  id: kx1mawmf
  metaTitle: ContextMenu - React Data Grid | Handsontable
angular:
  id: l4e1n9op
  metaTitle: ContextMenu - Angular Data Grid | Handsontable
---

# Plugin: ContextMenu

[[toc]]

## Description

This plugin creates the Handsontable Context Menu. It allows to create a new row or column at any place in the
grid among [other features](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely)
* `{ uiContainer: containerDomElement }` (to declare a container for all of the Context Menu's dom elements to be placed in).
* An array of [the available strings](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)

See [the context menu demo](@/guides/accessories-and-menus/context-menu/context-menu.md) for examples.

**Example**  
```js
// as a boolean
contextMenu: true
// as a array
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo']
```

## Options

### contextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/dataMap/metaManager/metaSchema.js#L1185

:::

_contextMenu.contextMenu : boolean | Array&lt;string&gt; | object_

The `contextMenu` option configures the [`ContextMenu`](@/api/contextMenu.md) plugin.

You can set the `contextMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`ContextMenu`](@/api/contextMenu.md) plugin                                                                                                                                                |
| `true`    | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)                 |
| An array  | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)              |
| An object | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Apply a [custom context menu configuration](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration) |

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Context menu: Context menu with default options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)
- [Context menu: Context menu with specific options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
- [Context menu: Context menu with fully custom configuration options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration)
- [Plugins: `ContextMenu`](@/api/contextMenu.md)

**Default**: <code>undefined</code>  
**Example**  
```js
// enable the `ContextMenu` plugin
// use the default context menu options
contextMenu: true,

// enable the `ContextMenu` plugin
// and modify individual context menu options
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],

// enable the `ContextMenu` plugin
// and apply a custom context menu configuration
contextMenu: {
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L80

:::

_ContextMenu.DEFAULT\_ITEMS ⇒ Array&lt;string&gt;_

Context menu default items order when `contextMenu` options is set as `true`.


## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L266

:::

_contextMenu.close()_

Closes the menu.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L405

:::

_contextMenu.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L175

:::

_contextMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L131

:::

_contextMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L301

:::

_contextMenu.executeCommand(commandName, ...params)_

Execute context menu command.

The `executeCommand()` method works only for selected cells.

When no cells are selected, `executeCommand()` doesn't do anything.

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
| ...params | `*` | Additional parameters passed to command executor module. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L124

:::

_contextMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ContextMenu#enablePlugin](@/api/contextMenu.md#enableplugin) method is called.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L248

:::

_contextMenu.open(position, offset)_

Opens menu and re-position it based on the passed coordinates.

**Emits**: [`Hooks#event:beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow), [`Hooks#event:afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)  

| Param | Type | Description |
| --- | --- | --- |
| position | `Object` <br/> `Event` | An object with `top` and `left` properties which contains coordinates relative to the browsers viewport (without included scroll offsets). Or if the native event is passed the menu will be positioned based on the `pageX` and `pageY` coordinates. |
| offset | `Object` | An object allows applying the offset to the menu position. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/contextMenu/contextMenu.js#L166

:::

_contextMenu.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`contextMenu`](@/api/options.md#contextmenu)



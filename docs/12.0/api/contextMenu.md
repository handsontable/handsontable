---
title: ContextMenu
metaTitle: ContextMenu - Plugin - Handsontable Documentation
permalink: /12.0/api/context-menu
canonicalUrl: /api/context-menu
hotPlugin: true
editLink: false
---

# ContextMenu

[[toc]]

## Description

This plugin creates the Handsontable Context Menu. It allows to create a new row or column at any place in the
grid among [other features](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options).
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
* `'borders'` (with [Options#customBorders](@/api/options.md#customborders) turned on)
* `'commentsAddEdit'` (with [Options#comments](@/api/options.md#comments) turned on)
* `'commentsRemove'` (with [Options#comments](@/api/options.md#comments) turned on).

See [the context menu demo](@/guides/accessories-and-menus/context-menu.md) for examples.

**Example**  
```js
// as a boolean
contextMenu: true
// as a array
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo']
```

## Options

### contextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/dataMap/metaManager/metaSchema.js#L2354

:::

_contextMenu.contextMenu : boolean | Array&lt;string&gt; | object_

The `contextMenu` option configures the [`ContextMenu`](@/api/contextMenu.md) plugin.

You can set the `contextMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`ContextMenu`](@/api/contextMenu.md) plugin                                                                                                                                                |
| `true`    | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu.md#context-menu-with-default-options)                 |
| An array  | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options)              |
| An object | - Enable the [`ContextMenu`](@/api/contextMenu.md) plugin<br>- Apply a [custom context menu configuration](@/guides/accessories-and-menus/context-menu.md#context-menu-with-fully-custom-configuration) |

Read more:
- [Context menu &#8594;](@/guides/accessories-and-menus/context-menu.md)
- [Context menu: Context menu with default options &#8594;](@/guides/accessories-and-menus/context-menu.md#context-menu-with-default-options)
- [Context menu: Context menu with specific options &#8594;](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options)
- [Context menu: Context menu with fully custom configuration options &#8594;](@/guides/accessories-and-menus/context-menu.md#context-menu-with-fully-custom-configuration)
- [Plugins: `ContextMenu` &#8594;](@/api/contextMenu.md)

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
      name: 'option1'
    },
    'option2': {
      name: 'option2',
      submenu: {
        items: [
          {
            key: 'option2:suboption1',
            name: 'option2:suboption1',
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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L94

:::

_ContextMenu.DEFAULT\_ITEMS ⇒ Array&lt;string&gt;_

Context menu default items order when `contextMenu` options is set as `true`.


## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L246

:::

_contextMenu.close()_

Closes the menu.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L387

:::

_contextMenu.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L195

:::

_contextMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L155

:::

_contextMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L281

:::

_contextMenu.executeCommand(commandName, ...params)_

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
| ...params | `*` | Additional paramteres passed to command executor module. |



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L148

:::

_contextMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [ContextMenu#enablePlugin](@/api/contextMenu.md#enableplugin) method is called.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L210

:::

_contextMenu.open(event)_

Opens menu and re-position it based on the passed coordinates.


| Param | Type | Description |
| --- | --- | --- |
| event | `Event` | The mouse event object. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/440c4e816bdf6fc295f5dd12c660a8e6a45a2706/../handsontable/src/plugins/contextMenu/contextMenu.js#L185

:::

_contextMenu.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



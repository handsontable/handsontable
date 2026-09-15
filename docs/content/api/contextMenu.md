---
title: ContextMenu
metaTitle: ContextMenu - JavaScript Data Grid | Handsontable
permalink: /api/context-menu
canonicalUrl: /api/context-menu
searchCategory: API Reference
hotPlugin: false
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

[[toc]]
## Options

### contextMenu

::: ask-about-api contextMenu|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/dataMap/metaManager/metaSchema.ts#L1262

:::

_contextMenu.contextMenu : boolean | Array&lt;string&gt; | object_

The `contextMenu` option configures the `ContextMenu` plugin.

You can set the `contextMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the `ContextMenu` plugin                                                                                                                                                |
| `true`    | - Enable the `ContextMenu` plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)                 |
| An array  | - Enable the `ContextMenu` plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)              |
| An object | - Enable the `ContextMenu` plugin<br>- Apply a [custom context menu configuration](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration) |

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Context menu: Context menu with default options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)
- [Context menu: Context menu with specific options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options)
- [Context menu: Context menu with fully custom configuration options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-a-fully-custom-configuration)

This option can only be set at the [grid level](@/guides/getting-started/configuration-options/configuration-options.md#set-grid-options).
It has no effect when set in the [`columns`](@/api/options.md#columns), [`cells`](@/api/options.md#cells), or [`cell`](@/api/options.md#cell) options.

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

::: ask-about-api DEFAULT_ITEMS|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L121

:::

_ContextMenu.DEFAULT\_ITEMS ⇒ Array&lt;string&gt;_

Context menu default items order when `contextMenu` options is set as `true`.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L102

:::

_ContextMenu.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L92

:::

_ContextMenu.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L97

:::

_ContextMenu.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.



### SEPARATOR

::: ask-about-api SEPARATOR|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L112

:::

_ContextMenu.SEPARATOR ⇒ MenuItemConfig_

The item descriptor that identifies a menu separator. Use it as a value in a custom
`items` configuration object to insert a separator line at that key.


## Methods

### close

::: ask-about-api close|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L297

:::

_contextMenu.close()_

Closes the menu.



### destroy

::: ask-about-api destroy|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L360

:::

_contextMenu.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L186

:::

_contextMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L150

:::

_contextMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### executeCommand

::: ask-about-api executeCommand|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L330

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

::: ask-about-api isEnabled|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L145

:::

_contextMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ContextMenu#enablePlugin](@/api/contextMenu.md#enableplugin) method is called.



### open

::: ask-about-api open|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L275

:::

_contextMenu.open(position, offset, [anchorRectProvider])_

Opens the menu and positions it based on the passed coordinates.

**Emits**: [`Hooks#event:beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow), [`Hooks#event:afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)  
**Example**  
```js
const menu = hot.getPlugin('contextMenu');

hot.selectCell(0, 0);
menu.open({ top: 50, left: 50 });
```

| Param | Type | Description |
| --- | --- | --- |
| position | `Object` <br/> `Event` | An object with `top` and `left` properties (coordinates relative to the browser viewport, without scroll offsets), or a native browser `Event` instance (e.g., a `MouseEvent`). |
| offset | `Object` | An object that applies an offset to the menu position. |
| [anchorRectProvider] | `function` | `optional` Returns the current anchor rectangle for scroll-follow repositioning, or `null` when the anchor is no longer rendered. |



### updatePlugin

::: ask-about-api updatePlugin|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L179

:::

_contextMenu.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`contextMenu`](@/api/options.md#contextmenu)



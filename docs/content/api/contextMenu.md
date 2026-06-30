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
## Members

### DEFAULT_ITEMS

::: ask-about-api DEFAULT_ITEMS|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L111

:::

_ContextMenu.DEFAULT\_ITEMS ⇒ Array&lt;string&gt;_

Context menu default items order when `contextMenu` options is set as `true`.



### PLUGIN_DEPS

::: ask-about-api PLUGIN_DEPS|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L102

:::

_ContextMenu.PLUGIN\_DEPS_

Returns the list of plugin dependencies required before this plugin can be initialized.



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L92

:::

_ContextMenu.PLUGIN\_KEY_

Returns the plugin key used to identify this plugin in Handsontable settings.



### PLUGIN_PRIORITY

::: ask-about-api PLUGIN_PRIORITY|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L97

:::

_ContextMenu.PLUGIN\_PRIORITY_

Returns the priority order used to determine the order in which plugins are initialized.


## Methods

### close

::: ask-about-api close|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L282

:::

_contextMenu.close()_

Closes the menu.



### destroy

::: ask-about-api destroy|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L345

:::

_contextMenu.destroy()_

Destroys the plugin instance.



### disablePlugin

::: ask-about-api disablePlugin|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L176

:::

_contextMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L140

:::

_contextMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### executeCommand

::: ask-about-api executeCommand|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L315

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L135

:::

_contextMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [ContextMenu#enablePlugin](@/api/contextMenu.md#enableplugin) method is called.



### open

::: ask-about-api open|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L260

:::

_contextMenu.open(position, offset)_

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



### updatePlugin

::: ask-about-api updatePlugin|ContextMenu

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/contextMenu/contextMenu.ts#L169

:::

_contextMenu.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`contextMenu`](@/api/options.md#contextmenu)



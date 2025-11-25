---
title: DropdownMenu
metaTitle: DropdownMenu - JavaScript Data Grid | Handsontable
permalink: /api/dropdown-menu
canonicalUrl: /api/dropdown-menu
searchCategory: API Reference
hotPlugin: true
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

# Plugin: DropdownMenu

[[toc]]

## Description

This plugin creates the Handsontable Dropdown Menu. It allows to create a new column at any place in the grid
among [other features](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely).

or array of any available strings:
* `["col_left", "col_right", "remove_col", "---------", "undo", "redo"]`.

See [the dropdown menu demo](@/guides/columns/column-menu/column-menu.md) for examples.

**Example**  
::: only-for javascript
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
:::

::: only-for react
```jsx
<HotTable
  data={data}
  comments={true}
  // enable and configure dropdown menu
  dropdownMenu={['remove_col', '---------', 'make_read_only', 'alignment']}
/>
```
:::

::: only-for angular
```ts
settings = {
  data: data,
  comments: true,
  // enable and configure dropdown menu
  dropdownMenu: ["remove_col", "---------", "make_read_only", "alignment"],
};
```

```html
<hot-table [settings]="settings"></hot-table>
```
:::

## Options

### dropdownMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/dataMap/metaManager/metaSchema.js#L2093

:::

_dropdownMenu.dropdownMenu : boolean | object | Array&lt;string&gt;_

The `dropdownMenu` option configures the [`DropdownMenu`](@/api/dropdownMenu.md) plugin.

You can set the `dropdownMenu` option to one of the following:

| Setting   | Description                                                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `false`   | Disable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin                                                                                                                                   |
| `true`    | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Use the [default context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-default-options)    |
| An array  | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Modify [individual context menu options](@/guides/accessories-and-menus/context-menu/context-menu.md#context-menu-with-specific-options) |
| An object | - Enable the [`DropdownMenu`](@/api/dropdownMenu.md) plugin<br>- Apply a custom dropdown menu configuration                                                                                  |

Read more:
- [Context menu](@/guides/accessories-and-menus/context-menu/context-menu.md)
- [Plugins: `DropdownMenu`](@/api/dropdownMenu.md)

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L118

:::

_DropdownMenu.DEFAULT\_ITEMS ⇒ Array_

Default menu items order when `dropdownMenu` is enabled by setting the config item to `true`.


## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L369

:::

_dropdownMenu.close()_

Closes dropdown menu.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L590

:::

_dropdownMenu.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L253

:::

_dropdownMenu.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L184

:::

_dropdownMenu.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.

**Emits**: [`Hooks#event:afterDropdownMenuDefaultOptions`](@/api/hooks.md#afterdropdownmenudefaultoptions), [`Hooks#event:beforeDropdownMenuSetItems`](@/api/hooks.md#beforedropdownmenusetitems)  


### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L400

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L174

:::

_dropdownMenu.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [DropdownMenu#enablePlugin](@/api/dropdownMenu.md#enableplugin) method is called.



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L353

:::

_dropdownMenu.open(position, offset)_

Opens menu and re-position it based on the passed coordinates.

**Emits**: [`Hooks#event:beforeDropdownMenuShow`](@/api/hooks.md#beforedropdownmenushow), [`Hooks#event:afterDropdownMenuShow`](@/api/hooks.md#afterdropdownmenushow)  

| Param | Type | Description |
| --- | --- | --- |
| position | `Object` <br/> `Event` | An object with `top` and `left` properties which contains coordinates relative to the browsers viewport (without included scroll offsets). Or if the native event is passed the menu will be positioned based on the `pageX` and `pageY` coordinates. |
| offset | `Object` | An object allows applying the offset to the menu position. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/15460242731ee7c57820ef77901ad19aec57936d/handsontable/src/plugins/dropdownMenu/dropdownMenu.js#L244

:::

_dropdownMenu.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`dropdownMenu`](@/api/options.md#dropdownmenu)



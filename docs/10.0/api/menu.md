---
title: Menu
metaTitle: Menu - API Reference - Handsontable Documentation
permalink: /10.0/api/menu
canonicalUrl: /api/menu
hotPlugin: false
editLink: false
---

# Menu

[[toc]]
## Options

### contextMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L1794

:::

_contextMenu.contextMenu : boolean | Array&lt;string&gt; | object_

Defines if the right-click context menu should be enabled. Context menu allows to create new row or column at any
place in the grid among [other features](@/guides/accessories-and-menus/context-menu.md).
Possible values:
* `true` (to enable default options),
* `false` (to disable completely)
* an array of [predefined options](@/guides/accessories-and-menus/context-menu.md#context-menu-with-specific-options),
* an object [with defined structure](@/guides/accessories-and-menus/context-menu.md#context-menu-with-fully-custom-configuration).

If the value is an object, you can also customize the options with:
* `disableSelection` - a `boolean`, if set to true it prevents mouseover from highlighting the item for selection
* `isCommand` - a `boolean`, if set to false it prevents clicks from executing the command and closing the menu.

See [the context menu demo](@/guides/accessories-and-menus/context-menu.md) for examples.

**Default**: <code>undefined</code>  
**Example**  
```js
// as a boolean
contextMenu: true,

// as an array
contextMenu: ['row_above', 'row_below', '---------', 'undo', 'redo'],

// as an object (`name` attribute is required in the custom keys)
contextMenu: {
  items: {
    "option1": {
      name: "option1"
    },
    "option2": {
      name: "option2",
      submenu: {
        items: [
          {
            key: "option2:suboption1",
            name: "option2:suboption1",
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

## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L261

:::

_menu.close([closeParent])_

Close menu.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [closeParent] | `boolean` | <code>false</code> | `optional` If `true` try to close parent menu if exists. |



### closeAllSubMenus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L335

:::

_menu.closeAllSubMenus()_

Close all opened sub menus.



### closeSubMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L322

:::

_menu.closeSubMenu(row)_

Close sub menu at row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L351

:::

_menu.destroy()_

Destroy instance.



### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L378

:::

_menu.executeCommand([event])_

Execute menu command.


| Param | Type | Description |
| --- | --- | --- |
| [event] | `Event` | `optional` The mouse event object. |



### getSelectedItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L102

:::

_menu.getSelectedItem() ⇒ object | null_

Returns currently selected menu item. Returns `null` if no item was selected.



### hasSelectedItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L111

:::

_menu.hasSelectedItem() ⇒ boolean_

Checks if the menu has selected (highlighted) any item from the menu list.



### isAllSubMenusClosed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L344

:::

_menu.isAllSubMenusClosed() ⇒ boolean_

Checks if all created and opened sub menus are closed.



### isCommandPassive
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L409

:::

_menu.isCommandPassive(commandDescriptor) ⇒ boolean_

Checks if the passed command is passive or not. The command is passive when it's marked as
disabled, the descriptor object contains `isCommand` property set to `false`, command
is a separator, or the item is recognized as submenu. For passive items the menu is not
closed automatically after the user trigger the command through the UI.


| Param | Type | Description |
| --- | --- | --- |
| commandDescriptor | `object` | Selected menu item from the menu data source. |



### isOpened
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L369

:::

_menu.isOpened() ⇒ boolean_

Checks if menu was opened.


**Returns**: `boolean` - Returns `true` if menu was opened.  

### isSubMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L130

:::

_menu.isSubMenu() ⇒ boolean_

Check if menu is using as sub-menu.



### onAfterSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L820

:::

_menu.onAfterSelection(r, c, r2, c2, preventScrolling)_

On after selection listener.


| Param | Type | Description |
| --- | --- | --- |
| r | `number` | Selection start row index. |
| c | `number` | Selection start column index. |
| r2 | `number` | Selection end row index. |
| c2 | `number` | Selection end column index. |
| preventScrolling | `object` | Object with `value` property where its value change will be observed. |



### open
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L140

:::

_menu.open()_

Open menu.

**Emits**: [`Hooks#event:beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow), [`Hooks#event:afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)  


### openSubMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L289

:::

_menu.openSubMenu(row) ⇒ [Menu](@/api/menu.md) | boolean_

Open sub menu at the provided row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |


**Returns**: [`Menu`](#menu) | `boolean` - Returns created menu or `false` if no one menu was created.  

### selectFirstCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L506

:::

_menu.selectFirstCell()_

Select first cell in opened menu.



### selectLastCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L519

:::

_menu.selectLastCell()_

Select last cell in opened menu.



### selectNextCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L536

:::

_menu.selectNextCell(row, col)_

Select next cell in opened menu.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| col | `number` | Column index. |



### selectPrevCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L556

:::

_menu.selectPrevCell(row, col)_

Select previous cell in opened menu.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| col | `number` | Column index. |



### setMenuItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L93

:::

_menu.setMenuItems(menuItems)_

Set array of objects which defines menu items.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array` | Menu items to display. |



### setOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L121

:::

_menu.setOffset(area, offset)_

Set offset menu position for specified area (`above`, `below`, `left` or `right`).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| area | `string` |  | Specified area name (`above`, `below`, `left` or `right`). |
| offset | `number` | <code>0</code> | Offset value. |



### setPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L422

:::

_menu.setPosition(coords)_

Set menu position based on dom event or based on literal object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `Event` <br/> `object` | Event or literal Object with coordinates. |



### setPositionAboveCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L451

:::

_menu.setPositionAboveCursor(cursor)_

Set menu position above cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setPositionBelowCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L465

:::

_menu.setPositionBelowCursor(cursor)_

Set menu position below cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setPositionOnLeftOfCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L496

:::

_menu.setPositionOnLeftOfCursor(cursor)_

Set menu position on the left of cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setPositionOnRightOfCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/contextMenu/menu.js#L479

:::

_menu.setPositionOnRightOfCursor(cursor)_

Set menu position on the right of cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



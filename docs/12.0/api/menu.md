---
title: Menu
metaTitle: Menu - API Reference - Handsontable Documentation
permalink: /12.0/api/menu
canonicalUrl: /api/menu
hotPlugin: false
editLink: false
---

# Menu

[[toc]]

## Description


## Methods

### close
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L408

:::

_menu.close([closeParent])_

Close menu.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [closeParent] | `boolean` | <code>false</code> | `optional` If `true` try to close parent menu if exists. |



### closeAllSubMenus
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L482

:::

_menu.closeAllSubMenus()_

Close all opened sub menus.



### closeSubMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L469

:::

_menu.closeSubMenu(row)_

Close sub menu at row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L498

:::

_menu.destroy()_

Destroy instance.



### executeCommand
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L525

:::

_menu.executeCommand([event])_

Execute menu command.


| Param | Type | Description |
| --- | --- | --- |
| [event] | `Event` | `optional` The mouse event object. |



### getSelectedItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L117

:::

_menu.getSelectedItem() ⇒ object | null_

Returns currently selected menu item. Returns `null` if no item was selected.



### hasSelectedItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L126

:::

_menu.hasSelectedItem() ⇒ boolean_

Checks if the menu has selected (highlighted) any item from the menu list.



### isAllSubMenusClosed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L491

:::

_menu.isAllSubMenusClosed() ⇒ boolean_

Checks if all created and opened sub menus are closed.



### isCommandPassive
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L556

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L516

:::

_menu.isOpened() ⇒ boolean_

Checks if menu was opened.


**Returns**: `boolean` - Returns `true` if menu was opened.  

### isSubMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L145

:::

_menu.isSubMenu() ⇒ boolean_

Check if menu is using as sub-menu.



### onAfterSelection
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L918

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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L155

:::

_menu.open()_

Open menu.

**Emits**: [`Hooks#event:beforeContextMenuShow`](@/api/hooks.md#beforecontextmenushow), [`Hooks#event:afterContextMenuShow`](@/api/hooks.md#aftercontextmenushow)  


### openSubMenu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L436

:::

_menu.openSubMenu(row) ⇒ [Menu](@/api/menu.md) | boolean_

Open sub menu at the provided row index.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |


**Returns**: [`Menu`](#menu) | `boolean` - Returns created menu or `false` if no one menu was created.  

### selectFirstCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L689

:::

_menu.selectFirstCell()_

Select first cell in opened menu.



### selectLastCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L702

:::

_menu.selectLastCell()_

Select last cell in opened menu.



### selectNextCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L722

:::

_menu.selectNextCell(row, col)_

Select next cell in opened menu.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| col | `number` | Column index. |



### selectPrevCell
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L742

:::

_menu.selectPrevCell(row, col)_

Select previous cell in opened menu.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | Row index. |
| col | `number` | Column index. |



### setHorizontalPositionForLtr
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L612

:::

_menu.setHorizontalPositionForLtr(cursor)_

Set menu horizontal position for LTR mode.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setHorizontalPositionForRtl
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L599

:::

_menu.setHorizontalPositionForRtl(cursor)_

Set menu horizontal position for RTL mode.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setMenuItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L108

:::

_menu.setMenuItems(menuItems)_

Set array of objects which defines menu items.


| Param | Type | Description |
| --- | --- | --- |
| menuItems | `Array` | Menu items to display. |



### setOffset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L136

:::

_menu.setOffset(area, offset)_

Set offset menu position for specified area (`above`, `below`, `left` or `right`).


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| area | `string` |  | Specified area name (`above`, `below`, `left` or `right`). |
| offset | `number` | <code>0</code> | Offset value. |



### setPosition
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L569

:::

_menu.setPosition(coords)_

Set menu position based on dom event or based on literal object.


| Param | Type | Description |
| --- | --- | --- |
| coords | `Event` <br/> `object` | Event or literal Object with coordinates. |



### setPositionAboveCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L625

:::

_menu.setPositionAboveCursor(cursor)_

Set menu position above cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setPositionBelowCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L639

:::

_menu.setPositionBelowCursor(cursor)_

Set menu position below cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setPositionOnLeftOfCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L673

:::

_menu.setPositionOnLeftOfCursor(cursor)_

Set menu position on the left of cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



### setPositionOnRightOfCursor
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/plugins/contextMenu/menu.js#L653

:::

_menu.setPositionOnRightOfCursor(cursor)_

Set menu position on the right of cursor object.


| Param | Type | Description |
| --- | --- | --- |
| cursor | `Cursor` | `Cursor` object. |



---
title: SelectUI
metaTitle: SelectUI - API Reference - Handsontable Documentation
permalink: /10.0/api/select-ui
canonicalUrl: /api/select-ui
hotPlugin: false
editLink: false
---

# SelectUI

[[toc]]
## Members

### items
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L37

:::

_selectUI.items : Array_

List of available select options.



### menu
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L31

:::

_selectUI.menu : [Menu](@/api/menu.md)_

Instance of [Menu](@/api/menu.md).


## Methods

### build
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L79

:::

_selectUI.build()_

Build DOM structure.



### closeOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L149

:::

_selectUI.closeOptions()_

Close select dropdown menu.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L190

:::

_selectUI.destroy()_

Destroy instance.



### openOptions
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L132

:::

_selectUI.openOptions()_

Open select dropdown menu with available options.



### registerHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L45

:::

_selectUI.registerHooks()_

Register all necessary hooks.



### setItems
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L54

:::

_selectUI.setItems(items)_

Set options which can be selected in the list.


| Param | Type | Description |
| --- | --- | --- |
| items | `Array` | Array of objects with required keys `key` and `name`. |



### translateNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L68

:::

_selectUI.translateNames(items) ⇒ Array_

Translate names of menu items.


| Param | Type | Description |
| --- | --- | --- |
| items | `Array` | Array of objects with required keys `key` and `name`. |


**Returns**: `Array` - Items with translated `name` keys.  

### update
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/filters/ui/select.js#L111

:::

_selectUI.update()_

Update DOM structure.



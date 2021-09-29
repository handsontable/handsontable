---
title: StaticRegister
metaTitle: StaticRegister - API Reference - Handsontable Documentation
permalink: /10.0/api/static-register
canonicalUrl: /api/static-register
hotPlugin: false
editLink: false
---

# StaticRegister

[[toc]]
## Methods

### getItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/staticRegister.js#L29

:::

_staticRegister~getItem(name) ⇒ \*_

Retrieve the item from the collection.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Identification of the item. |


**Returns**: `*` - Returns item which was saved in the collection.  

### getNames
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/staticRegister.js#L48

:::

_staticRegister~getNames() ⇒ Array_

Retrieve list of names registered from the collection.


**Returns**: `Array` - Returns an array of strings with all names under which objects are stored.  

### getValues
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/staticRegister.js#L57

:::

_staticRegister~getValues() ⇒ Array_

Retrieve all registered values from the collection.


**Returns**: `Array` - Returns an array with all values stored in the collection.  

### hasItem
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/staticRegister.js#L39

:::

_staticRegister~hasItem(name) ⇒ boolean_

Check if item under specified name is exists.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Identification of the item. |


**Returns**: `boolean` - Returns `true` or `false` depends on if element exists in the collection.  

### register
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/utils/staticRegister.js#L19

:::

_staticRegister~register(name, item)_

Register an item to the collection. If the item under the same was exist earlier then this item will be replaced with new one.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | Identification of the item. |
| item | `*` | Item to save in the collection. |



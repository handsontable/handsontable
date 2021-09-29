---
title: Storage
metaTitle: Storage - API Reference - Handsontable Documentation
permalink: /10.0/api/storage
canonicalUrl: /api/storage
hotPlugin: false
editLink: false
---

# Storage

[[toc]]
## Options

### persistentState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/dataMap/metaManager/metaSchema.js#L1020

:::

_persistentState.persistentState : boolean_

Turns on saving the state of column sorting, column positions and column sizes in local storage.

You can save any sort of data in local storage to preserve table state between page reloads.  In order to enable
data storage mechanism, `persistentState` option must be set to `true` (you can set it either during Handsontable
initialization or using the `updateSettings` method). When `persistentState` is enabled it exposes 3 hooks:

__persistentStateSave__ (key: String, value: Mixed).

  * Saves value under given key in browser local storage.

__persistentStateLoad__ (key: String, valuePlaceholder: Object).

  * Loads `value`, saved under given key, form browser local storage. The loaded `value` will be saved in
  `valuePlaceholder.value` (this is due to specific behaviour of `Hooks.run()` method). If no value have
  been saved under key `valuePlaceholder.value` will be `undefined`.

__persistentStateReset__ (key: String).

  * Clears the value saved under `key`. If no `key` is given, all values associated with table will be cleared.

__Note:__ The main reason behind using `persistentState` hooks rather than regular LocalStorage API is that it
ensures separation of data stored by multiple Handsontable instances. In other words, if you have two (or more)
instances of Handsontable on one page, data saved by one instance won't be accessible by the second instance.
Those two instances can store data under the same key and no data would be overwritten.

__Important:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.

**Default**: <code>false</code>  
**Example**  
```js
// enable the persistent state plugin
persistentState: true,
```

## Methods
## Members

### prefix
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L21

:::

_storage.prefix : string_

Prefix for key (id element).



### rootWindow
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L15

:::

_storage.rootWindow : Window_

Reference to proper window.



### savedKeys
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L28

:::

_storage.savedKeys : Array_

Saved keys.


## Methods

### loadValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L55

:::

_storage.loadValue(key, defaultValue) ⇒ object | undefined_

Load data from localStorage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key string. |
| defaultValue | `object` | Object containing the loaded data. |



### reset
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L67

:::

_storage.reset(key)_

Reset given data from localStorage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key string. |



### resetAll
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L75

:::

_storage.resetAll()_

Reset all data from localStorage.



### saveValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/storage.js#L38

:::

_storage.saveValue(key, value)_

Save data to localStorage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Key string. |
| value | `Mixed` | Value to save. |



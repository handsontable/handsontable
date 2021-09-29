---
title: PersistentState
metaTitle: PersistentState - Plugin - Handsontable Documentation
permalink: /10.0/api/persistent-state
canonicalUrl: /api/persistent-state
hotPlugin: true
editLink: false
---

# PersistentState

[[toc]]

## Description

Save the state of column sorting, column positions and column sizes in local storage to preserve table state
between page reloads.

In order to enable data storage mechanism, [Options#persistentState](@/api/options.md#persistentstate) option must be set to `true`.

When persistentState is enabled it exposes 3 hooks:
- [Hooks#persistentStateSave](@/api/hooks.md#persistentstatesave) - Saves value under given key in browser local storage.
- [Hooks#persistentStateLoad](@/api/hooks.md#persistentstateload) - Loads value, saved under given key, from browser local storage. The loaded
value will be saved in `saveTo.value`.
- [Hooks#persistentStateReset](@/api/hooks.md#persistentstatereset) - Clears the value saved under key. If no key is given, all values associated
with table will be cleared.


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

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L134

:::

_persistentState.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L81

:::

_persistentState.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L62

:::

_persistentState.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L55

:::

_persistentState.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` than the [PersistentState#enablePlugin](@/api/persistentState.md#enableplugin) method is called.



### loadValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L103

:::

_persistentState.loadValue(key, saveTo)_

Loads the value from local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Storage key. |
| saveTo | `object` | Saved value from local storage. |



### resetValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L122

:::

_persistentState.resetValue(key)_

Resets the data or all data from local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | [optional] Storage key. |



### saveValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L113

:::

_persistentState.saveValue(key, value)_

Saves the data to local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Storage key. |
| value | `Mixed` | Value to save. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/8ad9e39bea09f559dc24962196541af30811a8c3/../src/plugins/persistentState/persistentState.js#L90

:::

_persistentState.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](@/api/core.md#updatesettings) is invoked.



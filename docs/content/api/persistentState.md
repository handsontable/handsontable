---
title: PersistentState
metaTitle: PersistentState - JavaScript Data Grid | Handsontable
permalink: /api/persistent-state
canonicalUrl: /api/persistent-state
searchCategory: API Reference
hotPlugin: true
editLink: false
description: Use the PersistentState plugin with its API options and methods to keep the state of column sorting, column positions, and column sizes between page reloads.
react:
  metaTitle: PersistentState - React Data Grid | Handsontable
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

__Note:__ The main reason behind using `persistentState` hooks rather than regular LocalStorage API is that it
ensures separation of data stored by multiple Handsontable instances. In other words, if you have two (or more)
instances of Handsontable on one page, data saved by one instance won't be accessible by the second instance.
Those two instances can store data under the same key and no data would be overwritten.

__Important:__ In order for the data separation to work properly, make sure that each instance of Handsontable has a unique `id`.


## Options

### persistentState
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/dataMap/metaManager/metaSchema.js#L3338

:::

_persistentState.persistentState : boolean_

The `persistentState` option configures the [`PersistentState`](@/api/persistentState.md) plugin.

You can set the `persistentState` to one of the following:

| Setting           | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `false` (default) | Disable the [`PersistentState`](@/api/persistentState.md) plugin |
| `true`            | Enable the [`PersistentState`](@/api/persistentState.md) plugin  |

Read more:
- [Saving data: Saving data locally](@/guides/getting-started/saving-data.md#saving-data-locally)
- [Plugins: `PersistentState`](@/api/persistentState.md)

**Default**: <code>false</code>  
**Example**  
```js
// enable the `PersistentState` plugin
persistentState: true,
```

## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L147

:::

_persistentState.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L91

:::

_persistentState.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L72

:::

_persistentState.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L65

:::

_persistentState.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](@/api/hooks.md#beforeinit)
hook and if it returns `true` then the [PersistentState#enablePlugin](@/api/persistentState.md#enableplugin) method is called.



### loadValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L116

:::

_persistentState.loadValue(key, saveTo)_

Loads the value from local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Storage key. |
| saveTo | `object` | Saved value from local storage. |



### resetValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L135

:::

_persistentState.resetValue(key)_

Resets the data or all data from local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | [optional] Storage key. |



### saveValue
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L126

:::

_persistentState.saveValue(key, value)_

Saves the data to local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | `string` | Storage key. |
| value | `Mixed` | Value to save. |



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/persistentState/persistentState.js#L103

:::

_persistentState.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - [`persistentState`](@/api/options.md#persistentstate)



---
id: persistent-state
title: PersistentState
sidebar_label: PersistentState
slug: /api/persistent-state
---
## Description


Save the state of column sorting, column positions and column sizes in local storage to preserve table state
between page reloads.

In order to enable data storage mechanism, [Options#persistentState](Options#persistentState) option must be set to `true`.

When persistentState is enabled it exposes 3 hooks:
- [Hooks#persistentStateSave](Hooks#persistentStateSave) - Saves value under given key in browser local storage.
- [Hooks#persistentStateLoad](Hooks#persistentStateLoad) - Loads value, saved under given key, from browser local storage. The loaded
value will be saved in `saveTo.value`.
- [Hooks#persistentStateReset](Hooks#persistentStateReset) - Clears the value saved under key. If no key is given, all values associated
with table will be cleared.



## Members
### isEnabled
`persistentState.isEnabled() ⇒ boolean`

Checks if the plugin is enabled in the handsontable settings. This method is executed in [Hooks#beforeInit](Hooks#beforeInit)
hook and if it returns `true` than the [enablePlugin](#PersistentState+enablePlugin) method is called.



### enablePlugin
`persistentState.enablePlugin()`

Enables the plugin functionality for this Handsontable instance.



### disablePlugin
`persistentState.disablePlugin()`

Disables the plugin functionality for this Handsontable instance.



### updatePlugin
`persistentState.updatePlugin()`

Updates the plugin state. This method is executed when [Core#updateSettings](Core#updateSettings) is invoked.



### loadValue
`persistentState.loadValue(key, saveTo)`

Loads the value from local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Storage key. |
| saveTo | <code>object</code> | Saved value from local storage. |



### saveValue
`persistentState.saveValue(key, value)`

Saves the data to local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Storage key. |
| value | <code>Mixed</code> | Value to save. |



### resetValue
`persistentState.resetValue(key)`

Resets the data or all data from local storage.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | [optional] Storage key. |



### destroy
`persistentState.destroy()`

Destroys the plugin instance.




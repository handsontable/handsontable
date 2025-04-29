---
title: BasePlugin
metaTitle: BasePlugin - JavaScript Data Grid | Handsontable
permalink: /api/base-plugin
canonicalUrl: /api/base-plugin
searchCategory: API Reference
hotPlugin: false
editLink: false
id: wdr58c2w
description: Options, members, and methods of Handsontable's BasePlugin API.
react:
  id: wi27fiwz
  metaTitle: BasePlugin - React Data Grid | Handsontable
---

# BasePlugin

[[toc]]

## Members

### DEFAULT_SETTINGS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L52

:::

_BasePlugin.DEFAULT\_SETTINGS ⇒ object_

The `DEFAULT_SETTINGS` getter defines the plugin default settings.



### enabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L77

:::

_basePlugin.enabled : boolean_



### eventManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L61

:::

_basePlugin.eventManager : [EventManager](@/api/eventManager.md)_

The instance of the [EventManager](@/api/eventManager.md) class.



### initialized
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L81

:::

_basePlugin.initialized : boolean_



### isPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L73

:::

_basePlugin.isPluginsReady : boolean_



### pluginName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L65

:::

_basePlugin.pluginName : string_



### pluginsInitializedCallbacks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L69

:::

_basePlugin.pluginsInitializedCallbacks : Array&lt;function()&gt;_



### SETTING_KEYS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L41

:::

_BasePlugin.SETTING\_KEYS ⇒ Array&lt;string&gt; | boolean_

The `SETTING_KEYS` getter defines the keys that, when present in the config object, trigger the plugin update
after the `updateSettings` calls.
- When it returns `true`, the plugin updates after all `updateSettings` calls, regardless of the contents of the
config object.
- When it returns `false`, the plugin never updates on `updateSettings` calls.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L233

:::

_basePlugin.addHook(name, callback, [orderIndex])_

Add listener to plugin hooks system.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |
| callback | `function` | The listener function to add. |
| [orderIndex] | `number` | `optional` Order index of the callback.                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes. |



### callOnPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L269

:::

_basePlugin.callOnPluginsReady(callback)_

Register function which will be immediately called after all plugins initialized.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The listener function to call. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L257

:::

_basePlugin.clearHooks()_

Clear all hooks.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L361

:::

_basePlugin.destroy()_

Destroy plugin.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L182

:::

_basePlugin.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L175

:::

_basePlugin.enablePlugin()_

Enable plugin for this Handsontable instance.



### getSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L196

:::

_basePlugin.getSetting([settingName]) ⇒ \*_

Gets the plugin settings. If there is no setting under the provided key, it returns the default setting
provided by the DEFAULT_SETTINGS static property of the class.


| Param | Type | Description |
| --- | --- | --- |
| [settingName] | `string` | `optional` The setting name. If the setting name is not provided, it returns the whole plugin's settings object. |



### removeHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/0a86920b402089cbe2ec202bfb25fed11ce94644/handsontable/src/plugins/base/base.js#L248

:::

_basePlugin.removeHooks(name)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |



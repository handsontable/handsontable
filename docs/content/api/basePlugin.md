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
angular:
  id: k3d6m4mn
  metaTitle: BasePlugin - Angular Data Grid | Handsontable
---

# Plugin: BasePlugin

[[toc]]

## Members

### DEFAULT_SETTINGS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L53

:::

_BasePlugin.DEFAULT\_SETTINGS ⇒ object_

The `DEFAULT_SETTINGS` getter defines the plugin default settings.



### enabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L93

:::

_basePlugin.enabled : boolean_



### eventManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L77

:::

_basePlugin.eventManager : [EventManager](@/api/eventManager.md)_

The instance of the [EventManager](@/api/eventManager.md) class.



### initialized
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L97

:::

_basePlugin.initialized : boolean_



### isPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L89

:::

_basePlugin.isPluginsReady : boolean_



### pluginName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L81

:::

_basePlugin.pluginName : string_



### pluginsInitializedCallbacks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L85

:::

_basePlugin.pluginsInitializedCallbacks : Array&lt;function()&gt;_



### SETTING_KEYS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L42

:::

_BasePlugin.SETTING\_KEYS ⇒ Array&lt;string&gt; | boolean_

The `SETTING_KEYS` getter defines the keys that, when present in the config object, trigger the plugin update
after the `updateSettings` calls.
- When it returns `true`, the plugin updates after all `updateSettings` calls, regardless of the contents of the
config object.
- When it returns `false`, the plugin never updates on `updateSettings` calls.



### SETTINGS_VALIDATORS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L62

:::

_BasePlugin.SETTINGS\_VALIDATORS : function | object | null_

Validators for plugin settings.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L322

:::

_basePlugin.addHook(name, callback, [orderIndex])_

Add listener to plugin hooks system.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |
| callback | `function` | The listener function to add. |
| [orderIndex] | `number` | `optional` Order index of the callback.                              If > 0, the callback will be added after the others, for example, with an index of 1, the callback will be added before the ones with an index of 2, 3, etc., but after the ones with an index of 0 and lower.                              If < 0, the callback will be added before the others, for example, with an index of -1, the callback will be added after the ones with an index of -2, -3, etc., but before the ones with an index of 0 and higher.                              If 0 or no order index is provided, the callback will be added between the "negative" and "positive" indexes. |



### callOnPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L358

:::

_basePlugin.callOnPluginsReady(callback)_

Register function which will be immediately called after all plugins initialized.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The listener function to call. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L346

:::

_basePlugin.clearHooks()_

Clear all hooks.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L451

:::

_basePlugin.destroy()_

Destroy plugin.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L199

:::

_basePlugin.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L192

:::

_basePlugin.enablePlugin()_

Enable plugin for this Handsontable instance.



### getSetting
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L213

:::

_basePlugin.getSetting([settingName]) ⇒ \*_

Gets the plugin settings. If there is no setting under the provided key, it returns the default setting
provided by the DEFAULT_SETTINGS static property of the class.


| Param | Type | Description |
| --- | --- | --- |
| [settingName] | `string` | `optional` The setting name. If the setting name is not provided, it returns the whole plugin's settings object. |



### removeHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L337

:::

_basePlugin.removeHooks(name)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |



### updatePluginSettings
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d7c34a32a88f5db243e00359ae6b4de73d4b3e66/handsontable/src/plugins/base/base.js#L259

:::

_basePlugin.updatePluginSettings(newSettings) ⇒ object_

Update plugin settings.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | `*` | New settings. |


**Returns**: `object` - Updated settings object.  

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

### enabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L67

:::

_basePlugin.enabled : boolean_



### eventManager
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L51

:::

_basePlugin.eventManager : [EventManager](@/api/eventManager.md)_

The instance of the [EventManager](@/api/eventManager.md) class.



### initialized
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L71

:::

_basePlugin.initialized : boolean_



### isPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L63

:::

_basePlugin.isPluginsReady : boolean_



### pluginName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L55

:::

_basePlugin.pluginName : string_



### pluginsInitializedCallbacks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L59

:::

_basePlugin.pluginsInitializedCallbacks : Array&lt;function()&gt;_



### SETTING_KEYS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L40

:::

_BasePlugin.SETTING\_KEYS ⇒ Array&lt;string&gt; | boolean_

The `SETTING_KEYS` getter defines the keys that, when present in the config object, trigger the plugin update
after the `updateSettings` calls.
- When it returns `true`, the plugin updates after all `updateSettings` calls, regardless of the contents of the
config object.
- When it returns `false`, the plugin never updates on `updateSettings` calls.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L189

:::

_basePlugin.addHook(name, callback)_

Add listener to plugin hooks system.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |
| callback | `function` | The listener function to add. |



### callOnPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L225

:::

_basePlugin.callOnPluginsReady(callback)_

Register function which will be immediately called after all plugins initialized.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The listener function to call. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L213

:::

_basePlugin.clearHooks()_

Clear all hooks.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L317

:::

_basePlugin.destroy()_

Destroy plugin.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L177

:::

_basePlugin.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L170

:::

_basePlugin.enablePlugin()_

Enable plugin for this Handsontable instance.



### removeHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/91b68bce6e4e4890dc56ea7a58a59c0f04a9a2d0/handsontable/src/plugins/base/base.js#L204

:::

_basePlugin.removeHooks(name)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |



---
title: BasePlugin
metaTitle: BasePlugin - JavaScript Data Grid | Handsontable
permalink: /api/base-plugin
canonicalUrl: /api/base-plugin
searchCategory: API Reference
hotPlugin: false
editLink: false
description: Options, members, and methods of Handsontable's BasePlugin API.
react:
  metaTitle: BasePlugin - React Data Grid | Handsontable
---

# BasePlugin

[[toc]]

## Members

### SETTING_KEYS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L40

:::

_BasePlugin.SETTING\_KEYS ⇒ Array&lt;string&gt; | boolean_

The `SETTING_KEYS` getter defines the keys that, when present in the config object, trigger the plugin update
after the `updateSettings` calls.
- When it returns `true`, the plugin updates after all `updateSettings` calls, regardless of the contents of the
config object.
- When it returns `false`, the plugin never updates on `updateSettings` calls.


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L167

:::

_basePlugin.addHook(name, callback)_

Add listener to plugin hooks system.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |
| callback | `function` | The listener function to add. |



### callOnPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L203

:::

_basePlugin.callOnPluginsReady(callback)_

Register function which will be immediately called after all plugins initialized.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The listener function to call. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L191

:::

_basePlugin.clearHooks()_

Clear all hooks.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L295

:::

_basePlugin.destroy()_

Destroy plugin.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L153

:::

_basePlugin.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L146

:::

_basePlugin.enablePlugin()_

Enable plugin for this Handsontable instance.



### removeHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/3397ce5ca20a640877710e3f1e935b4106754ee7/handsontable/src/plugins/base/base.js#L182

:::

_basePlugin.removeHooks(name)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |



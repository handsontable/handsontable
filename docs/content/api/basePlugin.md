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

[[toc]]

## Members

### DEFAULT_SETTINGS

::: ask-about-api DEFAULT_SETTINGS|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L162

:::

_BasePlugin.DEFAULT\_SETTINGS ⇒ object_

The DEFAULT_SETTINGS getter defines the plugin default settings.



### enabled

::: ask-about-api enabled|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L470

:::

_basePlugin.enabled : boolean_



### eventManager

::: ask-about-api eventManager|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L458

:::

_basePlugin.eventManager : [EventManager](@/api/eventManager.md)_

The instance of the EventManager class.



### initialized

::: ask-about-api initialized|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L473

:::

_basePlugin.initialized : boolean_



### isPluginsReady

::: ask-about-api isPluginsReady|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L467

:::

_basePlugin.isPluginsReady : boolean_



### PLUGIN_KEY

::: ask-about-api PLUGIN_KEY|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L142

:::

_BasePlugin.PLUGIN\_KEY_

Returns the plugin key used to identify and look up this plugin in Handsontable settings and the plugin registry.



### pluginName

::: ask-about-api pluginName|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L461

:::

_basePlugin.pluginName : string_



### pluginsInitializedCallbacks

::: ask-about-api pluginsInitializedCallbacks|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L464

:::

_basePlugin.pluginsInitializedCallbacks : Array&lt;function()&gt;_



### SETTING_KEYS

::: ask-about-api SETTING_KEYS|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L153

:::

_BasePlugin.SETTING\_KEYS ⇒ Array&lt;string&gt; | boolean_

The SETTING_KEYS getter defines the keys that, when present in the config object, trigger the plugin update
after the updateSettings calls.
- When it returns true, the plugin updates after all updateSettings calls, regardless of the contents of the
config object.
- When it returns false, the plugin never updates on updateSettings calls.



### SETTINGS_VALIDATORS

::: ask-about-api SETTINGS_VALIDATORS|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L169

:::

_BasePlugin.SETTINGS\_VALIDATORS : function | object | null_

Validators for plugin settings.


## Methods

### addHook

::: ask-about-api addHook|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L343

:::

_basePlugin.addHook()_

Registers a hook listener and tracks it so it can be removed automatically when the plugin is disabled.



### callOnPluginsReady

::: ask-about-api callOnPluginsReady|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L370

:::

_basePlugin.callOnPluginsReady(callback)_

Register function which will be immediately called after all plugins initialized.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The listener function to add. |



### clearHooks

::: ask-about-api clearHooks|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L361

:::

_basePlugin.clearHooks()_

Clear all hooks.



### destroy

::: ask-about-api destroy|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L425

:::

_basePlugin.destroy()_

Destroy plugin.



### disablePlugin

::: ask-about-api disablePlugin|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L250

:::

_basePlugin.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin

::: ask-about-api enablePlugin|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L245

:::

_basePlugin.enablePlugin()_

Enable plugin for this Handsontable instance.



### getSetting

::: ask-about-api getSetting|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L262

:::

_basePlugin.getSetting([settingName]) ⇒ T_

Gets the plugin settings. If there is no setting under the provided key, it returns the default setting
provided by the DEFAULT_SETTINGS static property of the class.


| Param | Type | Description |
| --- | --- | --- |
| [settingName] | `string` | `optional` The setting name. If the setting name is not provided, it returns the whole plugin's settings object. |



### init

::: ask-about-api init|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L174

:::

_basePlugin.init()_

Initializes the plugin by resolving its name, applying settings, and checking required dependencies.



### isHardConflictBlocked

::: ask-about-api isHardConflictBlocked|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L232

:::

_basePlugin.isHardConflictBlocked() ⇒ boolean_

Whether this plugin is blocked by a registered hard conflict (another top-level setting is truthy; for example
nestedRows blocks pagination, or manualRowMove blocks dataProvider). Emits a console warning when blocked.


**Returns**: `boolean` - true if the plugin must not enable.  

### removeHooks

::: ask-about-api removeHooks|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L354

:::

_basePlugin.removeHooks(name)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |



### updatePluginSettings

::: ask-about-api updatePluginSettings|BasePlugin

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/plugins/base/base.ts#L305

:::

_basePlugin.updatePluginSettings(newSettings) ⇒ object_

Update plugin settings.


| Param | Type | Description |
| --- | --- | --- |
| newSettings | `*` | New settings. |


**Returns**: `object` - Updated settings object.  

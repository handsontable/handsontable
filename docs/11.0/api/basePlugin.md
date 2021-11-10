---
title: BasePlugin
metaTitle: BasePlugin - API Reference - Handsontable Documentation
permalink: /11.0/api/base-plugin
canonicalUrl: /api/base-plugin
hotPlugin: false
editLink: false
---

# BasePlugin

[[toc]]

## Description


## Methods

### addHook
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L151

:::

_basePlugin.addHook(name, callback)_

Add listener to plugin hooks system.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |
| callback | `function` | The listener function to add. |



### callOnPluginsReady
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L187

:::

_basePlugin.callOnPluginsReady(callback)_

Register function which will be immediately called after all plugins initialized.


| Param | Type | Description |
| --- | --- | --- |
| callback | `function` | The listener function to call. |



### clearHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L175

:::

_basePlugin.clearHooks()_

Clear all hooks.



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L238

:::

_basePlugin.destroy()_

Destroy plugin.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L137

:::

_basePlugin.disablePlugin()_

Disable plugin for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L130

:::

_basePlugin.enablePlugin()_

Enable plugin for this Handsontable instance.



### removeHooks
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5e44cfb4149d57e5295a90f9847568b1ecbd9bbf/../handsontable/src/plugins/base/base.js#L166

:::

_basePlugin.removeHooks(name)_

Remove all hooks listeners by hook name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The hook name. |



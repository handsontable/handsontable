---
title: ShortcutManager
metaTitle: ShortcutManager - JavaScript Data Grid | Handsontable
permalink: /api/shortcut-manager
canonicalUrl: /api/shortcut-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: qos98msl
description: Options, members, and methods of Handsontable's ShortcutManager API.
react:
  id: doot085y
  metaTitle: ShortcutManager - React Data Grid | Handsontable
angular:
  id: p8i1r9wx
  metaTitle: ShortcutManager - Angular Data Grid | Handsontable
---

# Plugin: ShortcutManager

[[toc]]

## Description

The `ShortcutManager` API lets you store and manage [keyboard shortcut contexts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#keyboard-shortcut-contexts) ([`ShortcutContext`](@/api/shortcutContext.md)).

Each `ShortcutManager` object:
- Stores and manages its own set of keyboard shortcut contexts.
- Listens to the [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) events and runs actions for them.


## Methods

### addContext
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L47

:::

_shortcutManager.addContext(contextName, [scope]) ⇒ object_

Create a new [`ShortcutContext`](@/api/shortcutContext.md) object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contextName | `string` |  | The name of the new shortcut context |
| [scope] | `string` | <code>"table"</code> | `optional` The scope of the shortcut: `'table'` or `'global'` |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L212

:::

_shortcutManager.destroy() : function_

Destroy a context manager instance.



### getActiveContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L61

:::

_shortcutManager.getActiveContextName() ⇒ string_

Get the ID of the active [`ShortcutContext`](@/api/shortcutContext.md).



### getContext
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L72

:::

_shortcutManager.getContext(contextName) ⇒ object | undefined_

Get a keyboard shortcut context by its name.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |


**Returns**: `object` | `undefined` - A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts  

### isCtrlPressed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L198

:::

_shortcutManager.isCtrlPressed() ⇒ boolean_

Returns whether `control` or `meta` keys are pressed.



### releasePressedKeys
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L205

:::

_shortcutManager.releasePressedKeys() : function_

Release every previously pressed key.



### setActiveContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/87cd2c6f46a70dd6fcdb859ff622f430128192b7/handsontable/src/shortcuts/manager.js#L82

:::

_shortcutManager.setActiveContextName(contextName)_

Start listening to keyboard shortcuts within a given [`ShortcutContext`](@/api/shortcutContext.md).


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |



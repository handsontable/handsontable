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

# ShortcutManager

[[toc]]

## Description

The `ShortcutManager` API lets you store and manage [keyboard shortcut contexts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#keyboard-shortcut-contexts) ([`ShortcutContext`](@/api/shortcutContext.md)).

Each `ShortcutManager` object:
- Stores and manages its own set of keyboard shortcut contexts.
- Listens to the [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) events and runs actions for them.


## Methods

### addContext
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L46

:::

_shortcutManager.addContext(contextName) ⇒ object_

Create a new [`ShortcutContext`](@/api/shortcutContext.md) object.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the new shortcut context |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L198

:::

_shortcutManager.destroy() : function_

Destroy a context manager instance.



### getActiveContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L60

:::

_shortcutManager.getActiveContextName() ⇒ string_

Get the ID of the active [`ShortcutContext`](@/api/shortcutContext.md).



### getContext
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L71

:::

_shortcutManager.getContext(contextName) ⇒ object | undefined_

Get a keyboard shortcut context by its name.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |


**Returns**: `object` | `undefined` - A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts  

### isCtrlPressed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L184

:::

_shortcutManager.isCtrlPressed() ⇒ boolean_

Returns whether `control` or `meta` keys are pressed.



### releasePressedKeys
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L191

:::

_shortcutManager.releasePressedKeys() : function_

Release every previously pressed key.



### setActiveContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/577bac9e3b34c32e246c526d8ade7791f8b3bf2b/handsontable/src/shortcuts/manager.js#L81

:::

_shortcutManager.setActiveContextName(contextName)_

Start listening to keyboard shortcuts within a given [`ShortcutContext`](@/api/shortcutContext.md).


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |



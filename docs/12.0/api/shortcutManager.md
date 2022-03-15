---
title: ShortcutManager
metaTitle: ShortcutManager - API Reference - Handsontable Documentation
permalink: /12.0/api/shortcut-manager
canonicalUrl: /api/shortcut-manager
hotPlugin: false
editLink: false
---

# ShortcutManager

[[toc]]

## Description

The `ShortcutManager` API lets you store and manage [keyboard shortcut contexts](@/guides/accessories-and-menus/keyboard-shortcuts.md#keyboard-shortcut-contexts) ([`ShortcutContext`](@/api/shortcutcontext.md)).

Each `ShortcutManager` object:
- Stores and manages its own set of keyboard shortcut contexts.
- Listens to the [`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) events and runs actions for them.


## Methods

### addContext
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/shortcuts/manager.js#L45

:::

_shortcutManager.addContext(contextName) ⇒ object_

Create a new [`ShortcutContext`](@/api/shortcutcontext.md) object.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the new shortcut context |



### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/shortcuts/manager.js#L137

:::

_shortcutManager.destroy() : function_

Destroy a context manager instance.



### getActiveContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/shortcuts/manager.js#L59

:::

_shortcutManager.getActiveContextName() ⇒ string_

Get the ID of the active [`ShortcutContext`](@/api/shortcutcontext.md).



### getContext
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/shortcuts/manager.js#L70

:::

_shortcutManager.getContext(contextName) ⇒ object | undefined_

Get a [`ShortcutContext`](@/api/shortcutcontext.md) by its name.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |


**Returns**: `object` | `undefined` - A [`ShortcutContext`](@/api/shortcutcontext.md) that stores registered shortcuts  

### isCtrlPressed
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/shortcuts/manager.js#L130

:::

_shortcutManager.isCtrlPressed() ⇒ boolean_

Check if the `control` key is pressed.



### setActiveContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/d2e84994a1d67ea9aa4907ad220b8b089fe38276/handsontable/src/shortcuts/manager.js#L80

:::

_shortcutManager.setActiveContextName(contextName)_

Start listening to keyboard shortcuts within a given [`ShortcutContext`](@/api/shortcutcontext.md).


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |



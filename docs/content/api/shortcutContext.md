---
title: ShortcutContext
metaTitle: ShortcutContext - JavaScript Data Grid | Handsontable
permalink: /api/shortcut-context
canonicalUrl: /api/shortcut-context
searchCategory: API Reference
hotPlugin: false
editLink: false
description: Options, members, and methods of Handsontable's ShortcutContext API.
react:
  metaTitle: ShortcutContext - React Data Grid | Handsontable
---

# ShortcutContext

[[toc]]

## Description

The `ShortcutContext` API lets you store and manage [keyboard shortcuts](@/guides/accessories-and-menus/keyboard-shortcuts.md) in a given [context](@/guides/accessories-and-menus/keyboard-shortcuts.md#keyboard-shortcut-contexts).

Each `ShortcutContext` object stores and manages its own set of keyboard shortcuts.


## Methods

### addShortcut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/context.js#L43

:::

_shortcutContext.addShortcut(options)_

Add a keyboard shortcut to this context.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | `object` |  | The shortcut's options |
| options.keys | `Array<Array<string>>` |  | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers |
| options.callback | `function` |  | The shortcut's action |
| options.group | `object` |  | A group of shortcuts to which the shortcut belongs |
| [options.runOnlyIf] | `object` |  | `optional` A condition on which the shortcut's action runs |
| [options.stopPropagation] | `object` | <code>true</code> | `optional` If set to `true`: stops the event's propagation |
| [options.captureCtrl] | `object` | <code>false</code> | `optional` If set to `true`: captures the state of the Control/Meta modifier key |
| [options.preventDefault] | `object` | <code>true</code> | `optional` If set to `true`: prevents the default behavior |
| [options.position] | `object` | <code>&#x27;after&#x27;</code> | `optional` The order in which the shortcut's action runs: `'before'` or `'after'` the `relativeToGroup` group of actions |
| [options.relativeToGroup] | `object` |  | `optional` The name of a group of actions, used to determine an action's `position` |



### addShortcuts
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/context.js#L126

:::

_shortcutContext.addShortcuts(shortcuts, [options])_

Add multiple keyboard shortcuts to this context.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| shortcuts | `Array<object>` |  | List of shortcuts to add to this shortcut context |
| [options] | `object` |  | `optional` A shortcut's options |
| [options.callback] | `function` |  | `optional` A shortcut's action |
| [options.group] | `object` |  | `optional` A group of shortcuts to which a shortcut belongs |
| [options.runOnlyIf] | `object` |  | `optional` A condition on which a shortcut's action runs |
| [options.stopPropagation] | `object` | <code>true</code> | `optional` If set to `true`: stops the event's propagation |
| [options.preventDefault] | `object` | <code>true</code> | `optional` If set to `true`: prevents the default behavior |
| [options.position] | `object` | <code>&#x27;after&#x27;</code> | `optional` The order in which a shortcut's action runs: `'before'` or `'after'` a `relativeToGroup` group of actions |
| [options.relativeToGroup] | `object` |  | `optional` The name of a group of actions, used to determine an action's `position` |



### getShortcuts
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/context.js#L184

:::

_shortcutContext.getShortcuts(keys) ⇒ Array_

Get a shortcut's details.


| Param | Type | Description |
| --- | --- | --- |
| keys | `Array<string>` | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers |



### hasShortcut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/context.js#L200

:::

_shortcutContext.hasShortcut(keys) ⇒ boolean_

Check if a shortcut exists in this context.


| Param | Type | Description |
| --- | --- | --- |
| keys | `Array<string>` | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers |



### removeShortcutsByGroup
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/context.js#L158

:::

_shortcutContext.removeShortcutsByGroup(group)_

Remove a group of shortcuts from this context.


| Param | Type | Description |
| --- | --- | --- |
| group | `string` | The name of the group of shortcuts |



### removeShortcutsByKeys
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/context.js#L146

:::

_shortcutContext.removeShortcutsByKeys(keys)_

Remove a shortcut from this context.


| Param | Type | Description |
| --- | --- | --- |
| keys | `Array<string>` | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers |



---
title: CreateShortcutManager
metaTitle: CreateShortcutManager | Handsontable DataGrid for JavaScript
permalink: /api/create-shortcut-manager
canonicalUrl: /api/create-shortcut-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: wt56lf3y
description: Options, members, and methods of Handsontable DataGrid's CreateShortcutManager API.
react:
  id: smdsdtby
  metaTitle: CreateShortcutManager | Handsontable DataGrid for React
angular:
  id: o9h0q8uv
  metaTitle: CreateShortcutManager | Handsontable DataGrid for Angular
---

[[toc]]
## Members

### activeContextName

::: ask-about-api activeContextName|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L31

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS

::: ask-about-api CONTEXTS|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L24

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced

::: ask-about-api isCtrlKeySilenced|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L89

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the `captureCtrl` shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.



### isManagerDestroyed

::: ask-about-api isManagerDestroyed|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L95

:::

_createShortcutManager~isManagerDestroyed : boolean_

Set by `destroy()`. A shortcut callback can destroy the grid (a listener of the save an editor
shortcut makes), and the shortcuts still queued for the same keydown belong to the destroyed grid.


## Methods

### handleEventWithScope

::: ask-about-api handleEventWithScope|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L197

:::

_createShortcutManager~handleEventWithScope(event) ⇒ boolean_

Handle the event with the scope of the active context.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |



### isContextOfDestroyedManager

::: ask-about-api isContextOfDestroyedManager|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L103

:::

_createShortcutManager~isContextOfDestroyedManager(context) ⇒ boolean_

Tells whether the context belongs to this manager, which has been destroyed. A shortcut can forward
its keys to a context of another manager (a submenu forwards Tab to the main menu after closing
itself, which destroys the submenu's grid and its manager), and that one still runs.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` | The context to check. |



### recorderCallback

::: ask-about-api recorderCallback|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L169

:::

_createShortcutManager~recorderCallback(event, keys, context) ⇒ boolean_

A callback function for listening events from the recorder.

A context may declare a fallback, so that the keys it does not answer keep working while it is
active - an overlay that covers the grid without replacing it, for example. The chain is walked
here rather than inside the context, which keeps `hasShortcut()` and `getShortcuts()` answering
for a single context, as their documentation promises and as `hasEventShortcut()` needs.

**The walk moves on only when NOTHING in the current context ran.** A shortcut whose `runOnlyIf`
returned `true` stops it, whether or not its callback did anything - that is what lets a context
claim a key deliberately. A shortcut that is registered but declines (its `runOnlyIf` returned
`false`) does not shadow the fallback's answer for the same key, which is the whole point of
inheriting rather than listing keys by hand.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |
| keys | `Array<string>` | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers. |
| context | `object` <br/> `string` | The context object or name. |



### runContextShortcuts

::: ask-about-api runContextShortcuts|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L114

:::

_createShortcutManager~runContextShortcuts(event, keys, context) ⇒ Object_

Runs every shortcut the given context registers for the pressed keys, without consulting its
fallback.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |
| keys | `Array<string>` | Normalized pressed keys. |
| context | `object` | The context to run. |



### runGlobalScopedShortcuts

::: ask-about-api runGlobalScopedShortcuts|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L208

:::

_createShortcutManager~runGlobalScopedShortcuts(event, keys) ⇒ boolean_

Runs shortcuts registered on `scope: 'global'` contexts when the table shortcut pipeline is blocked.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |
| keys | `Array<string>` | Normalized pressed keys. |


**Returns**: `boolean` - Whether a shortcut canceled further handling.  

---
title: CreateShortcutManager
metaTitle: CreateShortcutManager - JavaScript Data Grid | Handsontable
permalink: /api/create-shortcut-manager
canonicalUrl: /api/create-shortcut-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: wt56lf3y
description: Options, members, and methods of Handsontable's CreateShortcutManager API.
react:
  id: smdsdtby
  metaTitle: CreateShortcutManager - React Data Grid | Handsontable
---

# CreateShortcutManager

[[toc]]
## Members

### activeContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/shortcuts/manager.js#L37

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/shortcuts/manager.js#L29

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/shortcuts/manager.js#L97

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the `captureCtrl` shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.


## Methods

### recorderCallback
  
::: source-code-link https://github.com/handsontable/handsontable/blob/e0cdc74f0107cd92954a77fc7d3dd441e806a880/handsontable/src/shortcuts/manager.js#L109

:::

_createShortcutManager~recorderCallback(event, keys, context) ⇒ boolean_

A callback function for listening events from the recorder.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |
| keys | `Array<string>` | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers. |
| context | `object` <br/> `string` | The context object or name. |



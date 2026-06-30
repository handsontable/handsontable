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
angular:
  id: o9h0q8uv
  metaTitle: CreateShortcutManager - Angular Data Grid | Handsontable
---

[[toc]]
## Members

### activeContextName

::: ask-about-api activeContextName|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/shortcuts/manager.ts#L31

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS

::: ask-about-api CONTEXTS|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/shortcuts/manager.ts#L24

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced

::: ask-about-api isCtrlKeySilenced|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/shortcuts/manager.ts#L89

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the `captureCtrl` shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.


## Methods

### handleEventWithScope

::: ask-about-api handleEventWithScope|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/shortcuts/manager.ts#L135

:::

_createShortcutManager~handleEventWithScope(event) ⇒ boolean_

Handle the event with the scope of the active context.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |



### recorderCallback

::: ask-about-api recorderCallback|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/shortcuts/manager.ts#L99

:::

_createShortcutManager~recorderCallback(event, keys, context) ⇒ boolean_

A callback function for listening events from the recorder.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |
| keys | `Array<string>` | Names of the shortcut's keys, (coming from [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)), in lowercase or uppercase, unified across browsers. |
| context | `object` <br/> `string` | The context object or name. |



### runGlobalScopedShortcuts

::: ask-about-api runGlobalScopedShortcuts|createShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/shortcuts/manager.ts#L146

:::

_createShortcutManager~runGlobalScopedShortcuts(event, keys) ⇒ boolean_

Runs shortcuts registered on `scope: 'global'` contexts when the table shortcut pipeline is blocked.


| Param | Type | Description |
| --- | --- | --- |
| event | `KeyboardEvent` | The keyboard event. |
| keys | `Array<string>` | Normalized pressed keys. |


**Returns**: `boolean` - Whether a shortcut cancelled further handling.  

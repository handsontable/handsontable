---
title: Context
metaTitle: Context - API Reference - Handsontable Documentation
permalink: /12.0/api/context
canonicalUrl: /api/context
hotPlugin: false
editLink: false
---

# Context

[[toc]]
## Methods

### addShortcut
  
::: source-code-link https://github.com/handsontable/handsontable/blob/27c6ad3d01bc41624363fb2e02857468548f5b28/handsontable/src/shortcuts/context.js#L43

:::

_context.addShortcut(options)_

Add a keyboard shortcut to this `ShortcutContext`.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | `object` |  | Options for shortcut's keys. |
| options.keys | `Array<Array<string>>` |  | Shortcut's keys being KeyboardEvent's key properties. Full list of values is [available here](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key). |
| options.callback | `function` |  | The callback. |
| options.group | `string` |  | Group for shortcut. |
| [options.runOnlyIf] | `function` |  | `optional` Option determines whether assigned callback should be performed. |
| [options.captureCtrl] | `boolean` | <code>false</code> | `optional` Option determines whether the Ctrl/Meta modifier keys will be                                              blocked for other listeners while executing this shortcut action. |
| [options.stopPropagation] | `boolean` | <code>true</code> | `optional` Option determines whether to stop event's propagation. |
| [options.preventDefault] | `boolean` | <code>true</code> | `optional` Option determines whether to prevent default behavior. |
| [options.relativeToGroup] | `string` |  | `optional` Group name, relative which the shortcut is placed. |
| [options.position] | `string` | <code>"after"</code> | `optional` Position where shortcut is placed. It may be added before or after another group. |



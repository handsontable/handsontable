---
title: ShortcutContext
metaTitle: ShortcutContext | Handsontable DataGrid for JavaScript
permalink: /api/shortcut-context
canonicalUrl: /api/shortcut-context
searchCategory: API Reference
hotPlugin: false
editLink: false
id: aksi47xv
description: Options, members, and methods of Handsontable DataGrid's ShortcutContext API.
react:
  id: qhf0cz5d
  metaTitle: ShortcutContext | Handsontable DataGrid for React
angular:
  id: a7t2c0st
  metaTitle: ShortcutContext | Handsontable DataGrid for Angular
---

[[toc]]
## Methods

### addShortcut

::: ask-about-api addShortcut|ShortcutContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L86

:::

_shortcutContext.addShortcut(options)_

Add a keyboard shortcut to this context.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | `object` |  | The shortcut's options |
| options.keys | `Array<Array<string>>` |  | Names of the shortcut's keys, in lowercase or uppercase, unified across browsers. You can use [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) values, such as `ArrowLeft`, and the Handsontable-specific `control/meta` virtual key name. `control/meta` matches `Control` on Windows and Linux, and `Meta` on macOS. |
| options.callback | `function` |  | The shortcut's action |
| options.group | `object` |  | A group of shortcuts to which the shortcut belongs |
| [options.runOnlyIf] | `object` |  | `optional` A condition on which the shortcut's action runs |
| [options.stopPropagation] | `object` | <code>false</code> | `optional` If set to `true`: stops the event's propagation |
| [options.captureCtrl] | `object` | <code>false</code> | `optional` If set to `true`: captures the state of the Control/Meta modifier key |
| [options.preventDefault] | `object` | <code>true</code> | `optional` If set to `true`: prevents the default behavior |
| [options.position] | `object` | <code>&#x27;after&#x27;</code> | `optional` The order in which the shortcut's action runs: `'before'` or `'after'` the `relativeToGroup` group of actions. The action goes next to the first action of that group. When you add several actions next to the same group, the newest one runs first. |
| [options.relativeToGroup] | `object` |  | `optional` The name of a group of actions, used to determine an action's `position` |
| [options.forwardToContext] | `object` |  | `optional` The context object where the event will be forwarded to. |



### addShortcuts

::: ask-about-api addShortcuts|ShortcutContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L156

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
| [options.stopPropagation] | `object` | <code>false</code> | `optional` If set to `true`: stops the event's propagation |
| [options.preventDefault] | `object` | <code>true</code> | `optional` If set to `true`: prevents the default behavior |
| [options.position] | `object` | <code>&#x27;after&#x27;</code> | `optional` The order in which a shortcut's action runs: `'before'` or `'after'` a `relativeToGroup` group of actions. The action goes next to the first action of that group. When you add several actions next to the same group, the newest one runs first. |
| [options.relativeToGroup] | `object` |  | `optional` The name of a group of actions, used to determine an action's `position` |
| [options.forwardToContext] | `object` |  | `optional` The context object where the event will be forwarded to. |



### getShortcuts

::: ask-about-api getShortcuts|ShortcutContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L207

:::

_shortcutContext.getShortcuts(keys) ⇒ Array_

Get a shortcut's details.


| Param | Type | Description |
| --- | --- | --- |
| keys | `Array<string>` | Names of the shortcut's keys, in lowercase or uppercase, unified across browsers. You can use [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) values, such as `ArrowLeft`, and the Handsontable-specific `control/meta` virtual key name. `control/meta` matches `Control` on Windows and Linux, and `Meta` on macOS. |



### hasShortcut

::: ask-about-api hasShortcut|ShortcutContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L222

:::

_shortcutContext.hasShortcut(keys) ⇒ boolean_

Check if a shortcut exists in this context.


| Param | Type | Description |
| --- | --- | --- |
| keys | `Array<string>` | Names of the shortcut's keys, in lowercase or uppercase, unified across browsers. You can use [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) values, such as `ArrowLeft`, and the Handsontable-specific `control/meta` virtual key name. `control/meta` matches `Control` on Windows and Linux, and `Meta` on macOS. |



### removeShortcutsByGroup

::: ask-about-api removeShortcutsByGroup|ShortcutContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L184

:::

_shortcutContext.removeShortcutsByGroup(group)_

Remove a group of shortcuts from this context.


| Param | Type | Description |
| --- | --- | --- |
| group | `string` | The name of the group of shortcuts |



### removeShortcutsByKeys

::: ask-about-api removeShortcutsByKeys|ShortcutContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L175

:::

_shortcutContext.removeShortcutsByKeys(keys)_

Remove a shortcut from this context.


| Param | Type | Description |
| --- | --- | --- |
| keys | `Array<string>` | Names of the shortcut's keys, in lowercase or uppercase, unified across browsers. You can use [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) values, such as `ArrowLeft`, and the Handsontable-specific `control/meta` virtual key name. `control/meta` matches `Control` on Windows and Linux, and `Meta` on macOS. |



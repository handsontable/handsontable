---
title: ShortcutManager
metaTitle: ShortcutManager | Handsontable DataGrid for JavaScript
permalink: /api/shortcut-manager
canonicalUrl: /api/shortcut-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
id: qos98msl
description: Options, members, and methods of Handsontable DataGrid's ShortcutManager API.
react:
  id: doot085y
  metaTitle: ShortcutManager | Handsontable DataGrid for React
angular:
  id: p8i1r9wx
  metaTitle: ShortcutManager | Handsontable DataGrid for Angular
---

[[toc]]
## Methods

### addContext

::: ask-about-api addContext|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L39

:::

_shortcutManager.addContext(contextName, [scope]) ⇒ object_

Create a new [`ShortcutContext`](@/api/shortcutContext.md) object.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contextName | `string` |  | The name of the new shortcut context |
| [scope] | `string` | <code>"table"</code> | `optional` The scope of the shortcut: `'table'` or `'global'` |



### destroy

::: ask-about-api destroy|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L274

:::

_shortcutManager.destroy() : function_

Destroy a context manager instance.



### getActiveContextName

::: ask-about-api getActiveContextName|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L49

:::

_shortcutManager.getActiveContextName() ⇒ string_

Get the ID of the active [`ShortcutContext`](@/api/shortcutContext.md).



### getContext

::: ask-about-api getContext|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L58

:::

_shortcutManager.getContext(contextName) ⇒ object | undefined_

Get a keyboard shortcut context by its name.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context. |


**Returns**: `object` | `undefined` - A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts.  

### getOrCreateContext

::: ask-about-api getOrCreateContext|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L68

:::

_shortcutManager.getOrCreateContext(contextName, [scope]) ⇒ object_

Get a keyboard shortcut context by its name, or create it if it doesn't exist.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contextName | `string` |  | The name of the shortcut context |
| [scope] | `string` | <code>"table"</code> | `optional` The scope of the shortcut: `'table'` or `'global'` |


**Returns**: `object` - A [`ShortcutContext`](@/api/shortcutContext.md) object that stores registered shortcuts  

### hasEventShortcut

::: ask-about-api hasEventShortcut|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L238

:::

_shortcutManager.hasEventShortcut(contextName, event) ⇒ boolean_

Check if any shortcut in the given context matches the keyboard event.
Uses the same key normalization as the shortcut recorder, including
the unified `control/meta` form.


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context to check against. |
| event | `KeyboardEvent` | The keyboard event to match. |



### isCtrlPressed

::: ask-about-api isCtrlPressed|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L262

:::

_shortcutManager.isCtrlPressed() ⇒ boolean_

Returns whether `control` or `meta` keys are pressed.

The state is re-read from the modifier flags of every keyboard event, so a synthetic
keyboard event dispatched without those flags reports the keys as released.



### releasePressedKeys

::: ask-about-api releasePressedKeys|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L268

:::

_shortcutManager.releasePressedKeys() : function_

Release every previously pressed key.



### setActiveContextName

::: ask-about-api setActiveContextName|ShortcutManager

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/manager.ts#L76

:::

_shortcutManager.setActiveContextName(contextName)_

Start listening to keyboard shortcuts within a given [`ShortcutContext`](@/api/shortcutContext.md).


| Param | Type | Description |
| --- | --- | --- |
| contextName | `string` | The name of the shortcut context |



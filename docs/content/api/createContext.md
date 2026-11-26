---
title: CreateContext
metaTitle: CreateContext API reference | Handsontable DataGrid for JavaScript
permalink: /api/create-context
canonicalUrl: /api/create-context
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### fallbackContext

::: ask-about-api fallbackContext|createContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L50

:::

_createContext~fallbackContext_

The context consulted when this one holds no shortcut for the pressed keys.

`getShortcuts()` and `hasShortcut()` deliberately ignore it - both are public API documented as
answering for *this* context, and `ShortcutManager#hasEventShortcut()` relies on that. The chain
is walked by the manager instead, when it dispatches a key event.


## Methods

### getFallbackContext

::: ask-about-api getFallbackContext|createContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L62

:::

_createContext~getFallbackContext() ⇒ object | null_

Returns the context consulted when this one holds no shortcut for the pressed keys.



### setFallbackContext

::: ask-about-api setFallbackContext|createContext

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/shortcuts/context.ts#L55

:::

_createContext~setFallbackContext(context)_

Sets the context consulted when this one holds no shortcut for the pressed keys.


| Param | Type | Description |
| --- | --- | --- |
| context | `object` <br/> `null` | The fallback context, or `null` to drop it. |



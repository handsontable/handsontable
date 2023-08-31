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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/ffd90e24b08cca1ecd8d5da4a9f2939d996d6dc7/handsontable/src/shortcuts/manager.js#L36

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/ffd90e24b08cca1ecd8d5da4a9f2939d996d6dc7/handsontable/src/shortcuts/manager.js#L28

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced
  
::: source-code-link https://github.com/handsontable/handsontable/blob/ffd90e24b08cca1ecd8d5da4a9f2939d996d6dc7/handsontable/src/shortcuts/manager.js#L91

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the `captureCtrl` shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.




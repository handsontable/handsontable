---
title: CreateShortcutManager
metaTitle: CreateShortcutManager - API Reference - Handsontable Documentation
permalink: /12.0/api/create-shortcut-manager
canonicalUrl: /api/create-shortcut-manager
hotPlugin: false
editLink: false
---

# CreateShortcutManager

[[toc]]
## Members

### activeContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5aabeed320156232ca30482eca172fb2d11f2f72/handsontable/src/shortcuts/manager.js#L35

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutcontext.md).



### CONTEXTS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5aabeed320156232ca30482eca172fb2d11f2f72/handsontable/src/shortcuts/manager.js#L27

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced
  
::: source-code-link https://github.com/handsontable/handsontable/blob/5aabeed320156232ca30482eca172fb2d11f2f72/handsontable/src/shortcuts/manager.js#L90

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

The variable, in combination with the `captureCtrl` shortcut option, allows capturing the state
of the pressed Control/Meta keys. Some keyboard shortcuts related to the selection to work
correctly need to use that feature.




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
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/shortcuts/manager.js#L35

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/shortcuts/manager.js#L27

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced
  
::: source-code-link https://github.com/handsontable/handsontable/blob/b12f53bf59ffd1b5d8daad41f560076366c49a0d/handsontable/src/shortcuts/manager.js#L90

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the [`captureCtrl`](@/api/shortcutContext.md) shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.




---
title: CreateShortcutManager
metaTitle: CreateShortcutManager API reference – JavaScript Data Grid | Handsontable
permalink: /api/create-shortcut-manager
canonicalUrl: /api/create-shortcut-manager
searchCategory: API Reference
hotPlugin: false
editLink: false
---

# CreateShortcutManager

[[toc]]
## Members

### activeContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/manager.js#L36

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/manager.js#L28

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced
  
::: source-code-link https://github.com/handsontable/handsontable/blob/56b93f7a7feebefc0e6571674c25fac3a0227aea/handsontable/src/shortcuts/manager.js#L91

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the `captureCtrl` shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.




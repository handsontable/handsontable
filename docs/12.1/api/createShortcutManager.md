---
title: CreateShortcutManager
metaTitle: CreateShortcutManager - API Reference - Handsontable Documentation
permalink: /12.1/api/create-shortcut-manager
canonicalUrl: /api/create-shortcut-manager
hotPlugin: false
editLink: false
---

# CreateShortcutManager

[[toc]]
## Members

### activeContextName
  
::: source-code-link https://github.com/handsontable/handsontable/blob/98067625adbf7bcc9f8c9aef30af0997bee2e74e/handsontable/src/shortcuts/manager.js#L36

:::

_createShortcutManager~activeContextName : string_

The name of the active [`ShortcutContext`](@/api/shortcutContext.md).



### CONTEXTS
  
::: source-code-link https://github.com/handsontable/handsontable/blob/98067625adbf7bcc9f8c9aef30af0997bee2e74e/handsontable/src/shortcuts/manager.js#L28

:::

_createShortcutManager~CONTEXTS : UniqueMap_

A unique map that stores keyboard shortcut contexts.



### isCtrlKeySilenced
  
::: source-code-link https://github.com/handsontable/handsontable/blob/98067625adbf7bcc9f8c9aef30af0997bee2e74e/handsontable/src/shortcuts/manager.js#L91

:::

_createShortcutManager~isCtrlKeySilenced : boolean_

This variable relates to the `captureCtrl` shortcut option,
which allows for capturing the state of the Control/Meta modifier key.
Some of the default keyboard shortcuts related to cell selection need this feature for working properly.




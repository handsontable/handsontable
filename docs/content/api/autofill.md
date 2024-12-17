---
title: Autofill
metaTitle: Autofill - JavaScript Data Grid | Handsontable
permalink: /api/autofill
canonicalUrl: /api/autofill
searchCategory: API Reference
hotPlugin: true
editLink: false
id: gybdfu49
description: Use the Autofill plugin with its API members and methods to enable the drag-down and copy-down features.
react:
  id: het268ia
  metaTitle: Autofill - React Data Grid | Handsontable
---

# Autofill

[[toc]]

## Description

This plugin provides "drag-down" and "copy-down" functionalities, both operated using the small square in the right
bottom of the cell selection.

"Drag-down" expands the value of the selected cells to the neighbouring cells when you drag the small
square in the corner.

"Copy-down" copies the value of the selection to all empty cells below when you double click the small square.


## Methods

### destroy
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/plugins/autofill/autofill.js#L649

:::

_autofill.destroy()_

Destroys the plugin instance.



### disablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/plugins/autofill/autofill.js#L135

:::

_autofill.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/plugins/autofill/autofill.js#L104

:::

_autofill.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/plugins/autofill/autofill.js#L97

:::

_autofill.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings.



### updatePlugin
  
::: source-code-link https://github.com/handsontable/handsontable/blob/34e9d0aded2c90f656e6de8cc0a811b812dd92c4/handsontable/src/plugins/autofill/autofill.js#L126

:::

_autofill.updatePlugin()_

Updates the plugin's state.

This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
 - `autofill`
 - [`fillHandle`](@/api/options.md#fillhandle)



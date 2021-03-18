---
title: Autofill
permalink: /next/api/autofill
canonicalUrl: /api/autofill
editLink: false
---

# {{ $frontmatter.title }}

[[toc]]

## Description


This plugin provides "drag-down" and "copy-down" functionalities, both operated using the small square in the right
bottom of the cell selection.

"Drag-down" expands the value of the selected cells to the neighbouring cells when you drag the small
square in the corner.

"Copy-down" copies the value of the selection to all empty cells below when you double click the small square.


## Members:

### autoInsertRow

_autofill.autoInsertRow : boolean_

Specifies if can insert new rows if needed.


## Methods:

### destroy

_autofill.destroy()_

Destroys the plugin instance.



### disablePlugin

_autofill.disablePlugin()_

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_autofill.enablePlugin()_

Enables the plugin functionality for this Handsontable instance.



### isEnabled

_autofill.isEnabled() ⇒ boolean_

Checks if the plugin is enabled in the Handsontable settings.



### updatePlugin

_autofill.updatePlugin()_

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



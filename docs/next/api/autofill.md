---
title: Autofill
permalink: /next/api/autofill
canonicalUrl: /api/autofill
editLink: false
---

# Autofill

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

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L89)

Specifies if can insert new rows if needed.


## Methods:

### destroy

_autofill.destroy()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L634)

Destroys the plugin instance.



### disablePlugin

_autofill.disablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L131)

Disables the plugin functionality for this Handsontable instance.



### enablePlugin

_autofill.enablePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L104)

Enables the plugin functionality for this Handsontable instance.



### isEnabled

_autofill.isEnabled() ⇒ boolean_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L97)

Checks if the plugin is enabled in the Handsontable settings.



### updatePlugin

_autofill.updatePlugin()_

[Source code](https://github.com/handsontable/handsontable/blob/develop/src/plugins/autofill/autofill.js#L122)

Updates the plugin state. This method is executed when [Core#updateSettings](./Core/#updateSettings) is invoked.



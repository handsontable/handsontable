---
title: MultiSelectEditor
metaTitle: MultiSelectEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/multi-select-editor
canonicalUrl: /api/multi-select-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
id: v8r1h6zk
react:
  id: c2m7p5xl
angular:
  id: a9t4d3yn
---

[[toc]]

## Description

Initializes the editor, creates DOM elements, and binds dropdown and hook events.


## Members

### _closeAfterDataChange

::: ask-about-api _closeAfterDataChange|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L361

:::

_multiSelectEditor.\_closeAfterDataChange_

Overrides the base flag to keep the editor open after data changes — multiselect saves on each selection.



### dropdownContainerElement

::: ask-about-api dropdownContainerElement|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L370

:::

_multiSelectEditor.dropdownContainerElement_

The container element passed to `DropdownController` that holds the dropdown UI.



### dropdownController

::: ask-about-api dropdownController|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L372

:::

_multiSelectEditor.dropdownController_

The controller responsible for rendering and managing the dropdown list.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L160

:::

_MultiSelectEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the multiselect editor.



### isFlippedHorizontally

::: ask-about-api isFlippedHorizontally|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L368

:::

_multiSelectEditor.isFlippedHorizontally : boolean_

`true` when the editor wrapper opened the dropdown toward the inline start of the edited cell.

Horizontal placement is applied on this wrapper in `refreshDimensions()`, so the flag
lives here — the same place `HandsontableEditor` keeps `isFlippedHorizontally`.


## Methods

### bindEvents

::: ask-about-api bindEvents|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L212

:::

_multiSelectEditor.bindEvents()_

Wires dropdown check/uncheck hooks, scroll hooks, destroy cleanup, and the search filter trigger.



### close

::: ask-about-api close|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L255

:::

_multiSelectEditor.close()_

Hides the dropdown element, unregisters keyboard shortcuts, and stops the search input listener.



### createElements

::: ask-about-api createElements|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L165

:::

_multiSelectEditor.createElements()_

Creates the outer container, dropdown container, accessibility attributes, and the DropdownController instance.



### destroy

::: ask-about-api destroy|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L338

:::

_multiSelectEditor.destroy()_

Closes the editor and resets the dropdown controller state, releasing DOM resources.



### finishEditing

::: ask-about-api finishEditing|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L207

:::

_multiSelectEditor.finishEditing()_

Delegates to the base finishEditing to complete saving or restoring the cell value.



### focus

::: ask-about-api focus|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L324

:::

_multiSelectEditor.focus()_

Focuses the first dropdown item when search input is disabled, or the search input otherwise.



### getInputElement

::: ask-about-api getInputElement|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L333

:::

_multiSelectEditor.getInputElement()_

Returns the underlying search input element from the dropdown's input controller.



### getValue

::: ask-about-api getValue|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L263

:::

_multiSelectEditor.getValue()_

Returns the currently selected values as an array to be written to the cell.



### open

::: ask-about-api open|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L233

:::

_multiSelectEditor.open()_

Shows the dropdown, positions it next to the edited cell, registers keyboard shortcuts, and focuses the appropriate element.



### prepare

::: ask-about-api prepare|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L182

:::

_multiSelectEditor.prepare()_

Prepares the editor for the given cell, resets the dropdown, syncs the current selection, and applies cell settings.



### refreshDimensions

::: ask-about-api refreshDimensions|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L282

:::

_multiSelectEditor.refreshDimensions([reevaluateHorizontalFlip])_

Repositions the dropdown next to the edited cell; closes the editor if the cell is no longer rendered.

When the list is wider than the remaining inline-end space, the wrapper shifts toward the
inline start so the list stays fully usable (DEV-1198).

Filter keystrokes pass `false` so the side chosen on open/scroll cannot jump as the
filtered list narrows. Check/uncheck uses the same sticky path. The wrapper offset
still updates, so a flipped list stays pinned to the cell's inline end at the new width.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [reevaluateHorizontalFlip] | `boolean` | <code>true</code> | `optional` When `false`, keep the current horizontal flip. |



### setValue

::: ask-about-api setValue|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L268

:::

_multiSelectEditor.setValue()_

No-op override — MultiSelectEditor saves data immediately on each check/uncheck event.



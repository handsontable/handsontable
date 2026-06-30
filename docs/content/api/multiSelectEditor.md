---
title: MultiSelectEditor
metaTitle: MultiSelectEditor API reference – JavaScript Data Grid | Handsontable
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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L276

:::

_multiSelectEditor.\_closeAfterDataChange_

Overrides the base flag to keep the editor open after data changes — multiselect saves on each selection.



### dropdownContainerElement

::: ask-about-api dropdownContainerElement|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L278

:::

_multiSelectEditor.dropdownContainerElement_

The container element passed to `DropdownController` that holds the dropdown UI.



### dropdownController

::: ask-about-api dropdownController|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L280

:::

_multiSelectEditor.dropdownController_

The controller responsible for rendering and managing the dropdown list.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L126

:::

_MultiSelectEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the multiselect editor.


## Methods

### bindEvents

::: ask-about-api bindEvents|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L175

:::

_multiSelectEditor.bindEvents()_

Wires dropdown check/uncheck hooks, scroll hooks, destroy cleanup, and the search filter trigger.



### close

::: ask-about-api close|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L217

:::

_multiSelectEditor.close()_

Hides the dropdown element, unregisters keyboard shortcuts, and stops the search input listener.



### createElements

::: ask-about-api createElements|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L131

:::

_multiSelectEditor.createElements()_

Creates the outer container, dropdown container, accessibility attributes, and the DropdownController instance.



### destroy

::: ask-about-api destroy|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L261

:::

_multiSelectEditor.destroy()_

Closes the editor and resets the dropdown controller state, releasing DOM resources.



### finishEditing

::: ask-about-api finishEditing|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L170

:::

_multiSelectEditor.finishEditing()_

Delegates to the base finishEditing to complete saving or restoring the cell value.



### focus

::: ask-about-api focus|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L247

:::

_multiSelectEditor.focus()_

Focuses the first dropdown item when search input is disabled, or the search input otherwise.



### getInputElement

::: ask-about-api getInputElement|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L256

:::

_multiSelectEditor.getInputElement()_

Returns the underlying search input element from the dropdown's input controller.



### getValue

::: ask-about-api getValue|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L224

:::

_multiSelectEditor.getValue()_

Returns the currently selected values as an array to be written to the cell.



### open

::: ask-about-api open|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L196

:::

_multiSelectEditor.open()_

Shows the dropdown, positions it next to the edited cell, registers keyboard shortcuts, and focuses the appropriate element.



### prepare

::: ask-about-api prepare|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L148

:::

_multiSelectEditor.prepare()_

Prepares the editor for the given cell, resets the dropdown, syncs the current selection, and applies cell settings.



### refreshDimensions

::: ask-about-api refreshDimensions|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L234

:::

_multiSelectEditor.refreshDimensions()_

Repositions the dropdown next to the edited cell; closes the editor if the cell is no longer rendered.



### setValue

::: ask-about-api setValue|MultiSelectEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/editors/multiSelectEditor/multiSelectEditor.ts#L229

:::

_multiSelectEditor.setValue()_

No-op override — MultiSelectEditor saves data immediately on each check/uncheck event.



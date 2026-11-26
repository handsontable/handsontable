---
title: HandsontableEditor
metaTitle: HandsontableEditor API reference | Handsontable DataGrid for JavaScript
permalink: /api/handsontable-editor
canonicalUrl: /api/handsontable-editor
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]
## Members

### appliedDropdownHeight

::: ask-about-api appliedDropdownHeight|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L723

:::

_handsontableEditor.appliedDropdownHeight_

The height last written to the sub-grid, so a scroll that changes nothing writes nothing.

Compared against the value this editor WROTE, never against `getDropdownHeight()`: that reads
`offsetHeight`, which comes back a pixel or two off the height that was set, so a gate on it
would never match and every scroll event would pay a sub-grid render.

`protected` rather than private because [AutocompleteEditor](@/api/autocompleteEditor.md) writes the height through
its own `setDropdownHeight()` and needs the same gate - without it a trimmed list re-wrote the
identical height twice per scroll event.



### EDITOR_TYPE

::: ask-about-api EDITOR_TYPE|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L158

:::

_HandsontableEditor.EDITOR\_TYPE_

Returns the unique editor type identifier for the Handsontable editor.



### innerSelectionOrigin

::: ask-about-api innerSelectionOrigin|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L713

:::

_handsontableEditor.innerSelectionOrigin_

How the inner grid's current selection came about: `'user'` for an explicit pick (the arrow
keys or a click on a choice), `'auto'` for one the editor derived from the value being typed,
`null` for no selection.

`finishEditing()` commits the inner grid's value over the typed one, and only the origin tells
the two apart - the selection itself looks the same either way.



### isFlippedHorizontally

::: ask-about-api isFlippedHorizontally|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L706

:::

_handsontableEditor.isFlippedHorizontally : boolean_

The flag determining if the editor is flipped horizontally (rendered on
the inline start of the edited cell) or not.



### isFlippedVertically

::: ask-about-api isFlippedVertically|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L701

:::

_handsontableEditor.isFlippedVertically : boolean_

The flag determining if the editor is flipped vertically (rendered on
the top of the edited cell) or not.


## Methods

### beginEditing

::: ask-about-api beginEditing|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L330

:::

_handsontableEditor.beginEditing(newInitialValue, event)_

Begins editing on a highlighted cell and hides fillHandle corner if was present.


| Param | Type | Description |
| --- | --- | --- |
| newInitialValue | `*` | The editor initial value. |
| event | `*` | The keyboard event object. |



### close

::: ask-about-api close|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L223

:::

_handsontableEditor.close()_

Closes the editor.



### createElements

::: ask-about-api createElements|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L339

:::

_handsontableEditor.createElements()_

Creates an editor's elements and adds necessary CSS classnames.



### finishEditing

::: ask-about-api finishEditing|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L353

:::

_handsontableEditor.finishEditing(restoreOriginalValue, ctrlDown, callback)_

Finishes editing and start saving or restoring process for the editing cell, or for every selected range.


| Param | Type | Description |
| --- | --- | --- |
| restoreOriginalValue | `boolean` | If true, then closes editor without saving value from the editor into a cell. |
| ctrlDown | `boolean` | If true, then saveValue will save editor's value to each cell in every selected range. |
| callback | `function` | The callback function, fired after editor closing. |



### getDropdownHeight

::: ask-about-api getDropdownHeight|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L549

:::

_handsontableEditor.getDropdownHeight() ⇒ number_

Return the DOM height of the editor's container.



### getDropdownWidth

::: ask-about-api getDropdownWidth|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L556

:::

_handsontableEditor.getDropdownWidth() ⇒ number_

Return the DOM width of the editor's container.



### getTargetDropdownHeight

::: ask-about-api getTargetDropdownHeight|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L572

:::

_handsontableEditor.getTargetDropdownHeight() ⇒ number_

Calculates the proposed/target editor height that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### getTargetDropdownWidth

::: ask-about-api getTargetDropdownWidth|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L564

:::

_handsontableEditor.getTargetDropdownWidth() ⇒ number_

Calculates the proposed/target editor width that should be set once the editor is opened.
The method may be overwritten in the child class to provide a custom size logic.



### limitDropdownIfNeeded

::: ask-about-api limitDropdownIfNeeded|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L428

:::

_handsontableEditor.limitDropdownIfNeeded(spaceAvailable)_

Caps the list at the free space on the side the flip just chose.

A `fixed` box adds no scrollable overflow, so whatever hangs past the containing block cannot
be reached by scrolling the page - and the sub-grid's own holder only scrolls WITHIN the
height the list is given. An uncapped list therefore keeps its last rows permanently off
screen: measured at 19 of 20 options reachable in a 400px viewport, against 20 of 20 before
the list became `fixed`, where the overhang still added to the page's own scroll height.

Capping to the free space rather than to the whole containing block keeps the edited cell
visible, which is what the `absolute` rules did.

[AutocompleteEditor](@/api/autocompleteEditor.md) overrides this to trim to whole rows against the choices it holds.


| Param | Type | Description |
| --- | --- | --- |
| spaceAvailable | `number` | The free space in px on the side the list is placed. |



### open

::: ask-about-api open|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L180

:::

_handsontableEditor.open()_

Opens the editor and adjust its size.



### prepare

::: ask-about-api prepare|HandsontableEditor

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/editors/handsontableEditor/handsontableEditor.ts#L283

:::

_handsontableEditor.prepare(row, col, prop, td, value, cellProperties)_

Prepares editor's meta data and configuration of the internal Handsontable's instance.


| Param | Type | Description |
| --- | --- | --- |
| row | `number` | The visual row index. |
| col | `number` | The visual column index. |
| prop | `number` <br/> `string` | The column property (passed when datasource is an array of objects). |
| td | `HTMLTableCellElement` | The rendered cell element. |
| value | `*` | The rendered value. |
| cellProperties | `object` | The cell meta object (see [Core#getCellMeta](@/api/core.md#getcellmeta)). |



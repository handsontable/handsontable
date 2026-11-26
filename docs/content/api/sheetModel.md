---
title: SheetModel
metaTitle: SheetModel API reference | Handsontable DataGrid for JavaScript
permalink: /api/sheet-model
canonicalUrl: /api/sheet-model
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description

Creates an empty model.


## Methods

### addSheet

::: ask-about-api addSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L260

:::

_sheetModel.addSheet()_

Appends a sheet. A `null`/omitted, blank, or whitespace-only name gets the next unique
`Sheet{num}` default.



### duplicateSheet

::: ask-about-api duplicateSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L316

:::

_sheetModel.duplicateSheet()_

Duplicates a sheet with a deep-copied data array and a derived unique name.



### getActiveSheet

::: ask-about-api getActiveSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L210

:::

_sheetModel.getActiveSheet()_

Returns the active sheet descriptor, or `null` when the model is empty.



### getDuplicateName

::: ask-about-api getDuplicateName|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L335

:::

_sheetModel.getDuplicateName(id) ⇒ string | null_

Returns the name `duplicateSheet()` would give a copy of a sheet now, or `null` for an unknown id.


| Param | Type | Description |
| --- | --- | --- |
| id | `number` | The sheet to copy. |



### getSheetById

::: ask-about-api getSheetById|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L216

:::

_sheetModel.getSheetById()_

Returns the full internal sheet record by id, or `null`.



### getSheets

::: ask-about-api getSheets|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L205

:::

_sheetModel.getSheets()_

Returns descriptors for all sheets in tab order.



### isNameTaken

::: ask-about-api isNameTaken|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L244

:::

_sheetModel.isNameTaken(name, exceptId) ⇒ boolean_

Tells whether a sheet other than `exceptId` already uses a name.


| Param | Type | Description |
| --- | --- | --- |
| name | `string` | The name, as it would be stored. |
| exceptId | `number` | The sheet the name is meant for. |



### moveSheet

::: ask-about-api moveSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L305

:::

_sheetModel.moveSheet()_

Moves a sheet to the given tab index. Returns `false` for unknown ids, and for an index that is
not an integer or is out of range.



### peekDefaultName

::: ask-about-api peekDefaultName|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L343

:::

_sheetModel.peekDefaultName() ⇒ string_

Returns the name a sheet added now without a name would get (`Sheet{n}`), without adding one.



### removeSheet

::: ask-about-api removeSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L290

:::

_sheetModel.removeSheet()_

Removes a sheet. The last remaining sheet cannot be removed. When the active
sheet is removed, the nearest remaining neighbor becomes active.



### renameSheet

::: ask-about-api renameSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L278

:::

_sheetModel.renameSheet()_

Renames a sheet. Returns `false` when the id is unknown or the name is taken.



### resolveId

::: ask-about-api resolveId|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L223

:::

_sheetModel.resolveId()_

Resolves a sheet id from an id or a unique name. Returns `null` when not found, and for a value that
is neither a number nor a string. A name is read the way it is stored (`clampSheetName()`), so the name a
sheet was given finds it, line breaks and surrounding spaces included.



### setActiveSheet

::: ask-about-api setActiveSheet|SheetModel

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/sheetsBar/sheetModel.ts#L250

:::

_sheetModel.setActiveSheet()_

Marks a sheet as active. Returns `false` for unknown ids.



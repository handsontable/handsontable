---
title: OvertakenEdits
metaTitle: OvertakenEdits API reference | Handsontable DataGrid for JavaScript
permalink: /api/overtaken-edits
canonicalUrl: /api/overtaken-edits
searchCategory: API Reference
hotPlugin: false
editLink: false
---

[[toc]]

## Description


## Methods

### overtakeWaitingSets

::: ask-about-api overtakeWaitingSets|OvertakenEdits

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/overtakenEdits.ts#L197

:::

_overtakenEdits.overtakeWaitingSets(isSaved)_

Called right before a refetch that follows a save loads its rows. Every set core still lists as waiting for
its validators will be dropped by the load, so the row id each change of a set DataProvider saves addresses is
read now, while the rows it was made on are still loaded. The id is read from the record core tracks for the
change (`getPhysicalRowOfChange()`), not from the visual row it was made at: a row move or an insert made while
it waits leaves another record there. An editor that waits for its validator is closed by
the load; its cell and the text the user typed are kept with the set it saved.


| Param | Type | Description |
| --- | --- | --- |
| isSaved | `function` | Tells whether DataProvider saves a set of the given changes and source. |



### reset

::: ask-about-api reset|OvertakenEdits

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/overtakenEdits.ts#L229

:::

_overtakenEdits.reset()_

Forgets every set. Called on a load that is not a refetch that follows a save, and when the plugin is
disabled: such a load drops the waiting sets for good.



### trackSet

::: ask-about-api trackSet|OvertakenEdits

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/overtakenEdits.ts#L169

:::

_overtakenEdits.trackSet(changes, [source])_

Notes a change set made through `setDataAtCell()` or `setDataAtRowProp()` while an overtaken set waits to be
written again: the cells it shares with an overtaken set are marked as written later. A validator's
correction belongs to the change it corrects, so it marks nothing.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | The change set. |
| [source] | `string` | `optional` The change source. |



### writeAgain

::: ask-about-api writeAgain|OvertakenEdits

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/plugins/dataProvider/overtakenEdits.ts#L243

:::

_overtakenEdits.writeAgain(changes, [source], rejectedChanges)_

Writes again a dropped set a refetch that follows a save overtook. Each change goes to the record it
addressed, found by its row id, with the set's own source. A change whose record is gone (removed on the
server, on another page, or without an id) stays dropped, and so does one whose cell was written again after
the load. The change the user confirmed in an editor goes through that editor again, see
`#reopenEditor()`.


| Param | Type | Description |
| --- | --- | --- |
| changes | `Array` | The dropped set. |
| [source] | `string` | `optional` The change source. |
| rejectedChanges | `Array` | The changes of the set a validator rejected under `allowInvalid: false`. |



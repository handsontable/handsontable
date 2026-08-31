---
type: how-to
title: Migrating from 18.2 to 18.3
metaTitle: Migrating from 18.2 to 18.3 - JavaScript Data Grid | Handsontable
description: Migrate from Handsontable 18.2 to Handsontable 18.3.
permalink: /migration-from-18.2-to-18.3
canonicalUrl: /migration-from-18.2-to-18.3
pageClass: migration-guide
react:
  metaTitle: Migrate from 18.2 to 18.3 - React Data Grid | Handsontable
angular:
  metaTitle: Migrate from 18.2 to 18.3 - Angular Data Grid | Handsontable
vue:
  metaTitle: Migrate from 18.2 to 18.3 - Vue Data Grid | Handsontable
searchCategory: Guides
category: Upgrade and migration
---
Migrate from Handsontable 18.2 to Handsontable 18.3.

For a detailed list of changes in this release, see the [Changelog](@/guides/upgrade-and-migration/changelog/changelog.md).

[[toc]]

Section 1 concerns what a cell editor writes when you confirm it without typing, and affects every grid.

## 1. Confirming an editor without typing writes nothing

This one applies to every grid, whatever your configuration.

Opening a cell editor and pressing <kbd>**Enter**</kbd> without typing used to write the editor's value back over the cell. The editor holds a string, because that is what an input can display, so the cell received that string rather than the value it already held. A cell holding `null` was left holding `''`. So was one holding `undefined`. A `true` became `'true'`, and a number in a [`text`](@/guides/cell-types/text-cell-type/text-cell-type.md) column became a string.

The write also fired [`beforeChange`](@/api/hooks.md#beforechange) and [`afterChange`](@/api/hooks.md#afterchange) each time, so opening a cell and closing it again reported an edit that never happened.

Such a confirm now writes nothing at all, and neither hook fires.

### Validation is unchanged

A cell with a [`validator`](@/api/options.md#validator) is still validated on that confirm. [`allowInvalid: false`](@/api/options.md#allowinvalid) still holds the editor open on a value the validator rejects. The validator now runs against the value the cell already holds, which is the same value it would have been handed before.

### Who is affected

- You count `afterChange` events to drive a dirty flag, an autosave, or a change tracker. You will see fewer of them. The ones you lose are the ones that reported an edit the user did not make.
- You cancel changes by returning `false` from `beforeChange`, **and** you rely on that closing the editor. See below.

### An editor that `beforeChange` used to close

Returning `false` from `beforeChange` closes the open editor. That is still true of a real edit. It is no longer true of a confirm that changed nothing, because there is no change to cancel and the hook does not run.

On such a confirm the validator decides, as it does everywhere else. If the cell has no validator, or the value passes, the editor closes as before. If the validator rejects the value and `allowInvalid` is `false`, the editor stays open. That is the same thing it already did when `beforeChange` returned `true`, so the two now agree. <kbd>**Escape**</kbd> closes the editor and leaves the value alone.

### How to migrate

Nothing to change in most cases. A dirty flag that counts `afterChange` becomes more accurate on its own.

If you need to know that the user opened and closed an editor, regardless of whether anything changed, `afterChange` was never the right signal for it. Use [`afterBeginEditing`](@/api/hooks.md#afterbeginediting) to see the editor open.

### Related: choosing what an emptied cell stores

Handsontable stored two different values for an empty cell depending on how you emptied it: <kbd>**Delete**</kbd>, [`setDataAtCell()`](@/api/core.md#setdataatcell) and a fill stored `null`, while clearing the editor or pasting a blank cell stored `''`. The new [`emptyValue`](@/api/options.md#emptyvalue) option lets you pick one. It is opt-in and the default is unchanged, so it needs no action on upgrade. See [Empty cell values](@/guides/getting-started/binding-to-data/binding-to-data.md#empty-cell-values).

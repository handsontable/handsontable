---
type: how-to
title: Text cell type
metaTitle: Text cell type - JavaScript Data Grid | Handsontable
description: Use the text cell type, the default cell type in Handsontable, to display and edit plain text values.
permalink: /text-cell-type
canonicalUrl: /text-cell-type
react:
  metaTitle: Text cell type - React Data Grid | Handsontable
angular:
  metaTitle: Text cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Text cell type - Vue Data Grid | Handsontable
searchCategory: Guides
category: Cell types
menuTag: new
---
Use the text cell type, the default cell type in Handsontable, to display and edit plain text values.

[[toc]]

## Overview

The text cell type is the default [cell type](@/guides/cell-types/cell-type/cell-type.md) in Handsontable. It renders a cell's value as plain text and lets you edit it with a standard text input. It has no built-in validator.

Because `text` is the default, you don't need to set `type: 'text'` for it to apply. Set it explicitly when you want to override a different type inherited from a higher configuration level, or when you want the configuration to state the type directly, for example to guard alphanumeric codes or values with leading zeros against being reformatted by another type.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/text-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/text-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/text-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/text-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/text-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/text-cell-type/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-types/text-cell-type/vue/example1.vue)

:::

:::

In the example above, the `sku` and `category` columns use `type: 'text'` explicitly, even though it's the default. This makes the configuration self-documenting: values such as `'004821'` are alphanumeric codes with leading zeros, not numbers, and the explicit type states that intent even if a later change sets a different type at the grid or column level.

## Adding a validator

The text cell type ships without a built-in [validator](@/guides/cell-functions/cell-validator/cell-validator.md). To validate text values, combine `type: 'text'` with your own validator function, and set [`allowInvalid`](@/api/options.md#allowinvalid) to `false` to reject invalid entries.

With `allowInvalid: false`, the cell editor doesn't close on an invalid value. It stays open until you either enter a value that passes validation or press <kbd>**Esc**</kbd> to cancel the edit and restore the previous value. See [invalid cell commit semantics](@/guides/cell-functions/cell-validator/cell-validator.md#invalid-cell-commit-semantics-vs-visual-marking) for the full behavior, including how it differs from `allowInvalid: true`.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-types/text-cell-type/javascript/example2.js)
@[code](@/content/guides/cell-types/text-cell-type/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/text-cell-type/react/example2.jsx)
@[code](@/content/guides/cell-types/text-cell-type/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/text-cell-type/angular/example2.ts)
@[code](@/content/guides/cell-types/text-cell-type/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-types/text-cell-type/vue/example2.vue)

:::

:::

## Limiting the text length

To limit how many characters a text cell can hold, set the [`maxLength`](@/api/options.md#maxlength) option. You don't need a custom validator. By default, the length is not limited.

::: only-for javascript

```js
columns: [
  // a code of up to 10 characters
  { data: 'sku', type: 'text', maxLength: 10 },
  // a comment of up to 140 characters, rejected when longer
  { data: 'comment', type: 'text', maxLength: 140, allowInvalid: false },
],
```

:::

::: only-for react

```jsx
columns={[
  // a code of up to 10 characters
  { data: 'sku', type: 'text', maxLength: 10 },
  // a comment of up to 140 characters, rejected when longer
  { data: 'comment', type: 'text', maxLength: 140, allowInvalid: false },
]}
```

:::

::: only-for angular

```ts
columns: [
  // a code of up to 10 characters
  { data: 'sku', type: 'text', maxLength: 10 },
  // a comment of up to 140 characters, rejected when longer
  { data: 'comment', type: 'text', maxLength: 140, allowInvalid: false },
],
```

:::

::: only-for vue

```html
<HotTable :settings="{
  columns: [
    // a code of up to 10 characters
    { data: 'sku', type: 'text', maxLength: 10 },
    // a comment of up to 140 characters, rejected when longer
    { data: 'comment', type: 'text', maxLength: 140, allowInvalid: false },
  ],
}" />
```

:::

`maxLength` counts the characters a reader sees, in the same way as the length limit of a sheet name in the [`SheetsBar`](@/api/sheetsBar.md) plugin. A flag, an emoji with a skin tone, and a letter with a combining accent each count as one character.

Handsontable applies the limit in two places:

- **In the cell editor.** The text editor, and any custom editor that extends it, stops the user from typing or pasting more characters than the limit allows. A pasted text that doesn't fit is cut at the limit. The editor never blocks deleting, so the user can shorten a value that is already too long, and typing into such a value doesn't remove the text that is already there. The [`autocomplete`](@/guides/cell-types/autocomplete-cell-type/autocomplete-cell-type.md), [`dropdown`](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), and [`handsontable`](@/guides/cell-types/handsontable-cell-type/handsontable-cell-type.md) editors cap what the user types in the same way, but the user can still pick an option that is longer than the limit. The validator then marks the option as invalid, or rejects it when `allowInvalid` is `false`. The editors of the other cell types, such as numeric, date, and password, don't limit input.
- **In validation.** A value that is longer than the limit is invalid. Handsontable checks the values that the user types, pastes into the grid, or writes with [`setDataAtCell()`](@/api/core.md#setdataatcell), and the values that [`validateCells()`](@/api/core.md#validatecells) checks. It doesn't check the values that you load with [`loadData()`](@/api/core.md#loaddata), [`updateData()`](@/api/core.md#updatedata), or [`setSourceDataAtCell()`](@/api/core.md#setsourcedataatcell), or that a data provider fetches. Call `validateCells()` to check them.

The [`allowInvalid`](@/api/options.md#allowinvalid) option decides what happens to a value that is too long. With `true` (the default), the grid keeps the value and marks the cell with the `htInvalid` class. With `false`, the grid rejects the value, and the cell editor stays open until the value fits.

If a cell has both `maxLength` and a [`validator`](@/api/options.md#validator), the value must pass both checks. Handsontable checks the length first. When the value is too long, it doesn't call your validator. Setting `validator` to `false` turns off the validator, but not the length check.

### Limits and edge cases

- **Only strings are checked.** Handsontable doesn't check a value that is stored as a number, such as the digits typed into a `numeric` cell, or as any other non-string type.
- **Set the option on the free-text columns.** The validator checks every string value in a cell that has a limit, whatever the cell type is. If you set `maxLength` at the grid level, it also applies to the text of `date`, `time`, `dropdown`, and `autocomplete` cells. With `maxLength: 8`, the date `'2026-10-02'` is invalid, and with `allowInvalid: false`, the grid rejects a dropdown option that is longer than the limit.
- **Validation is asynchronous.** A cell that has a limit validates every write, as any cell with a validator does. [`setDataAtCell()`](@/api/core.md#setdataatcell) applies the value after the validation finishes, and [`getDataAtCell()`](@/api/core.md#getdataatcell) returns the previous value until then. Use the [`afterChange`](@/api/hooks.md#afterchange) hook to react to the new value.
- **Spaces around the text don't count.** The editor and the validator both count the value after [`trimWhitespace`](@/api/options.md#trimwhitespace) is applied, so the leading and trailing spaces of a pasted text don't use up the limit.
- **Formulas.** With the [`Formulas`](@/api/formulas.md) plugin, the editor counts the formula that the user types, but the validator counts the calculated result. With `maxLength: 5`, the editor cuts `=SUM(A1:A10)` to `=SUM(`, although the result `55` fits. Set a limit on a column only if it holds no formulas.
- **An existing `maxLength` meta key.** If your app already uses `maxLength` as a custom cell meta key, for example to feed your own validator or editor, the built-in check and the editor limit now apply to those cells too. See [Migrating from 18.1 to 19.0](@/guides/upgrade-and-migration/migrating-from-18.1-to-19.0/migrating-from-18.1-to-19.0.md).

## Result

After configuring the text cell type, cells display and edit their value as plain text, with no formatting or masking applied. Combine it with [`maxLength`](@/api/options.md#maxlength) to limit the text length, or with a custom [`validator`](@/api/options.md#validator) to restrict which values a text cell accepts.

## Keyboard shortcuts

The text cell editor uses the standard [edition keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#edition-keyboard-shortcuts). It has no type-specific key bindings.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Cell validator](@/guides/cell-functions/cell-validator/cell-validator.md)

</div>

**Configuration options**

<div class="boxes-list">

- [type](@/api/options.md#type)
- [validator](@/api/options.md#validator)
- [allowInvalid](@/api/options.md#allowinvalid)
- [maxLength](@/api/options.md#maxlength)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getDataType()](@/api/core.md#getdatatype)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterSetCellMeta](@/api/hooks.md#aftersetcellmeta)
- [afterValidate](@/api/hooks.md#aftervalidate)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)
- [beforeValidate](@/api/hooks.md#beforevalidate)

</div>

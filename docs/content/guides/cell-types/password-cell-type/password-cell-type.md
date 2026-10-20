---
type: how-to
title: Password cell type
metaTitle: Password cell type | Handsontable DataGrid for JavaScript
description: Use the password cell type to mask confidential values by rendering entered characters as symbols.
permalink: /password-cell-type
canonicalUrl: /password-cell-type
react:
  metaTitle: Password cell type | Handsontable DataGrid for React
angular:
  metaTitle: Password cell type | Handsontable DataGrid for Angular
vue:
  metaTitle: Password cell type | Handsontable DataGrid for Vue
searchCategory: Guides
category: Cell types
menuTag: updated
---
Use the password cell type to mask confidential values by rendering entered characters as symbols.

The password cell type masks cell values with asterisks. Use it for PIN codes, access codes, or other values that should not be visible in plain text.

[[toc]]

## Overview

The password cell type behaves like a text cell, the only difference being that it masks its value using asterisks in the cell renderer. An `<input type="password">` field is used for the cell editor. Data is stored in the data source as plain text.

::: only-for javascript

::: example #example1 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example1.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example1.ts)

:::

:::

::: only-for react

::: example #example1 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example1.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example1.tsx)

:::

:::

::: only-for angular

::: example #example1 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example1.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example1.html)

:::

:::

::: only-for vue

::: example #example1 :vue3

@[code](@/content/guides/cell-types/password-cell-type/vue/example1.vue)

:::

:::

## Fixed hash length

By default, every hash has a length equal to the length of its corresponding value. Use option `hashLength` to set a fixed hash length.

::: only-for javascript

::: example #example2 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example2.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example2.ts)

:::

:::

::: only-for react

::: example #example2 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example2.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example2.tsx)

:::

:::

::: only-for angular

::: example #example2 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example2.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example2.html)

:::

:::

::: only-for vue

::: example #example2 :vue3

@[code](@/content/guides/cell-types/password-cell-type/vue/example2.vue)

:::

:::

## Custom hash symbol

By default, every hash consists of asterisks `*`. Use the option `hashSymbol` to set a custom hash symbol. You can use any character, entity, or even HTML. Note that you can't change the symbol used by the input field due to browser limitations.

::: only-for javascript

::: example #example3 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example3.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example3.ts)

:::

:::

::: only-for react

::: example #example3 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example3.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example3.tsx)

:::

:::

::: only-for angular

::: example #example3 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example3.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example3.html)

:::

:::

::: only-for vue

::: example #example3 :vue3

@[code](@/content/guides/cell-types/password-cell-type/vue/example3.vue)

:::

:::

## Reveal delay

Use the `hashRevealDelay` option to briefly show each character as you type it. After the delay (in milliseconds) elapses, the character is replaced by the hash symbol. This lets you confirm what you typed without permanently exposing the value.

When `hashRevealDelay` is set, the editor switches from a native `<input type="password">` to a `<input type="text">` field with manual masking. Only the most recently typed character stays visible - all preceding characters are already masked.

::: only-for javascript

::: example #example4 --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/javascript/example4.js)
@[code](@/content/guides/cell-types/password-cell-type/javascript/example4.ts)

:::

:::

::: only-for react

::: example #example4 :react --js 1 --ts 2

@[code](@/content/guides/cell-types/password-cell-type/react/example4.jsx)
@[code](@/content/guides/cell-types/password-cell-type/react/example4.tsx)

:::

:::

::: only-for angular

::: example #example4 :angular --ts 1 --html 2

@[code](@/content/guides/cell-types/password-cell-type/angular/example4.ts)
@[code](@/content/guides/cell-types/password-cell-type/angular/example4.html)

:::

:::

::: only-for vue

::: example #example4 :vue3

@[code](@/content/guides/cell-types/password-cell-type/vue/example4.vue)

:::

:::

## Copy, cut, paste, and autofill

The password cell type sets the [`copyable`](@/api/options.md#copyable) option to `false`, so a user action never moves a password value to the clipboard or to another cell. Each clipboard and fill action writes an empty value in its place:

| Action | What happens to a password cell |
| --- | --- |
| Copy | The clipboard gets an empty string for the cell. The previous clipboard content is replaced. In a range that also holds other cells, the password column copies as an empty column. |
| Cut | The cell is cleared, and the clipboard gets an empty string. You can't paste the cut value anywhere. |
| Paste | The cell accepts pasted text like a text cell. Pasting a copied password cell writes an empty string, which clears the target cell. |
| Autofill | Dragging the fill handle from a password cell fills the target cells with empty strings, which clears them. In a range that also holds other cells, the other columns fill as usual and the password column is cleared. A double-click on the fill handle fills only empty cells, so it clears nothing. |

To restore a cleared value, use undo (<kbd>**Ctrl**</kbd>/<kbd>**Cmd**</kbd>+<kbd>**Z**</kbd>).

The `copyable` option affects user actions only. The API still returns the real value: [`getDataAtCell()`](@/api/core.md#getdataatcell) and [`getSourceData()`](@/api/core.md#getsourcedata) read the plain text stored in the data source, while [`getCopyableData()`](@/api/core.md#getcopyabledata) returns an empty string for a password cell.

### Keep passwords from being cleared

To stop autofill, paste, and cut from clearing password cells, skip those changes in the [`beforeChange`](@/api/hooks.md#beforechange) hook. A skipped change leaves the cell's value as it was:

```js
beforeChange(changes, source) {
  if (!['Autofill.fill', 'CopyPaste.paste', 'CopyPaste.cut'].includes(source)) {
    return;
  }

  changes.forEach((change, index) => {
    const [row, prop, , newValue] = change ?? [];
    const isPasswordCell = change && this.getCellMeta(row, this.propToCol(prop)).type === 'password';

    // autofill and paste write an empty string, cut writes `null`
    if (isPasswordCell && (newValue === '' || newValue === null)) {
      changes[index] = null;
    }
  });
},
```

With this hook, a user can still clear a password cell by editing it, or with <kbd>**Delete**</kbd>.

## Result

After configuring the password cell type, cells display asterisks instead of the actual value. The editor uses an `<input type="password">` field (or `<input type="text">` when `hashRevealDelay` is set). The actual data is stored in plain text in the data source and is not encrypted by Handsontable DataGrid.

The Filters plugin's **Filter by value** list hashes each unique source value the same way the cell renderer does, including a custom `hashLength`. A custom `hashSymbol` is applied as a string -- the list paints labels as text nodes, so an HTML entity such as `&bull;` appears as the characters `&bull;`, not as a bullet. **Filter by condition** (for example Contains) and the search box at the top of the value list still match the source values, not the hashes.

## Keyboard shortcuts

The password cell editor is a text editor, so it uses the standard [edition keyboard shortcuts](@/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md#edition-keyboard-shortcuts). It has no password-specific key bindings.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)
- [Clipboard](@/guides/cell-features/clipboard/clipboard.md)

</div>

**Configuration options**

<div class="boxes-list">

- [type](@/api/options.md#type)
- [copyable](@/api/options.md#copyable)
- [hashLength](@/api/options.md#hashlength)
- [hashRevealDelay](@/api/options.md#hashrevealdelay)
- [hashSymbol](@/api/options.md#hashsymbol)

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
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeSetCellMeta](@/api/hooks.md#beforesetcellmeta)

</div>

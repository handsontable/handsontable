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

## Result

After configuring the text cell type, cells display and edit their value as plain text, with no formatting or masking applied. Combine it with a custom [`validator`](@/api/options.md#validator) to restrict which values a text cell accepts.

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

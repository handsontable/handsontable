---
type: how-to
title: Password cell type
metaTitle: Password cell type - JavaScript Data Grid | Handsontable
description: Use the password cell type to mask confidential values by rendering entered characters as symbols.
permalink: /password-cell-type
canonicalUrl: /password-cell-type
react:
  metaTitle: Password cell type - React Data Grid | Handsontable
angular:
  metaTitle: Password cell type - Angular Data Grid | Handsontable
vue:
  metaTitle: Password cell type - Vue Data Grid | Handsontable
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

## Result

After configuring the password cell type, cells display asterisks instead of the actual value. The editor uses an `<input type="password">` field (or `<input type="text">` when `hashRevealDelay` is set). The actual data is stored in plain text in the data source and is not encrypted by Handsontable.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell type](@/guides/cell-types/cell-type/cell-type.md)

</div>

**Configuration options**

<div class="boxes-list">

- [type](@/api/options.md#type)
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

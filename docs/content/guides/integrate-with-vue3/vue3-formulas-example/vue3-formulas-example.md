---
id: o47p9rb3
title: Formulas integration in Vue 3
metaTitle: Formulas integration in Vue 3 - Vue 3 Data Grid | Handsontable
description: Integrate the Formulas plugin with your Vue 3 data grid.
permalink: /vue3-formulas-example
canonicalUrl: /vue3-formulas-example
react:
  id: b711n01r
  metaTitle: Formulas integration in Vue 3 - Vue 3 Data Grid | Handsontable
angular:
  id: 4h37k7c4
  metaTitle: Formulas integration in Vue 3 - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Formulas integration in Vue 3

Integrate the Formulas plugin with your Vue 3 data grid.

[[toc]]

## Overview

You can use the Formulas plugin to perform Excel-like calculations in your business applications. It does it by an integration with our other product, [HyperFormula](https://hyperformula.handsontable.com/), which is a powerful calculation engine with an extensive number of features.

[Find out more about the Formulas plugin](@/guides/formulas/formula-calculation/formula-calculation.md)

## Example - Using the Formulas plugin

When using HyperFormula with Vue 3, never let Vue make the HyperFormula instance reactive.
Vue's proxying interferes with the internal state of the engine and leads to subtle bugs and performance issues.

Wrap the instance with `markRaw()`:
```js
import { markRaw } from 'vue';
import { HyperFormula } from 'hyperformula';

const hfInstance = markRaw(HyperFormula.buildEmpty());
```
This keeps the engine untouched and ensures it behaves exactly as intended.

::: example #example1 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-formulas-example/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-formulas-example/vue/example1.js)

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Formula calculation](@/guides/formulas/formula-calculation/formula-calculation.md)

</div>

### Related API reference

- Configuration options:
  - [`formulas`](@/api/options.md#formulas)
- Core methods:
  - [`getPlugin()`](@/api/core.md#getplugin)
- Hooks:
  - [`afterFormulasValuesUpdate`](@/api/hooks.md#afterformulasvaluesupdate)
  - [`afterNamedExpressionAdded`](@/api/hooks.md#afternamedexpressionadded)
  - [`afterNamedExpressionRemoved`](@/api/hooks.md#afternamedexpressionremoved)
  - [`afterSheetAdded`](@/api/hooks.md#aftersheetadded)
  - [`afterSheetRemoved`](@/api/hooks.md#aftersheetremoved)
  - [`afterSheetRenamed`](@/api/hooks.md#aftersheetrenamed)
- Plugins:
  - [`Formulas`](@/api/formulas.md)

---
id: 1ng09buy
title: Custom renderer in Vue 2
metaTitle: Custom cell renderer - Vue 2 Data Grid | Handsontable
description: Create a custom cell renderer, and use it in your Vue 2 data grid by declaring it as a function.
permalink: /vue-custom-renderer-example
canonicalUrl: /vue-custom-renderer-example
react:
  id: rv0aqgfe
  metaTitle: Custom cell renderer - Vue 2 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 2
---

# Custom renderer in Vue 2

Create a custom cell renderer, and use it in your Vue 2 data grid by declaring it as a function.

[[toc]]

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

## Example - Declaring a renderer as a function

The following example is an implementation of `@handsontable/vue` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :vue --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-custom-renderer-example/vue/example1.html)
@[code](@/content/guides/integrate-with-vue/vue-custom-renderer-example/vue/example1.js)

:::

## Related articles

### Related guides

<div class="boxes-list gray">

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)

</div>

### Related API reference

- APIs:
  - [`BasePlugin`](@/api/basePlugin.md)
- Configuration options:
  - [`renderer`](@/api/options.md#renderer)
- Core methods:
  - [`getCellMeta()`](@/api/core.md#getcellmeta)
  - [`getCellMetaAtRow()`](@/api/core.md#getcellmetaatrow)
  - [`getCellsMeta()`](@/api/core.md#getcellsmeta)
  - [`getCellRenderer()`](@/api/core.md#getcellrenderer)
  - [`setCellMeta()`](@/api/core.md#setcellmeta)
  - [`setCellMetaObject()`](@/api/core.md#setcellmetaobject)
  - [`removeCellMeta()`](@/api/core.md#removecellmeta)
- Hooks:
  - [`afterGetCellMeta`](@/api/hooks.md#aftergetcellmeta)
  - [`afterGetColumnHeaderRenderers`](@/api/hooks.md#aftergetcolumnheaderrenderers)
  - [`afterGetRowHeaderRenderers`](@/api/hooks.md#aftergetrowheaderrenderers)
  - [`afterRenderer`](@/api/hooks.md#afterrenderer)
  - [`beforeGetCellMeta`](@/api/hooks.md#beforegetcellmeta)
  - [`beforeRenderer`](@/api/hooks.md#beforerenderer)

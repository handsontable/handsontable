---
id: m9wjas8j
title: Custom renderer in Angular
metaTitle: Custom cell renderer - Angular Data Grid | Handsontable
description: Create a custom cell renderer, and use it in your Angular data grid by declaring it as a function.
permalink: /angular-custom-renderer-example
canonicalUrl: /angular-custom-renderer-example
react:
  id: ntsul6e8
  metaTitle: Custom cell renderer - Angular Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Angular
---

# Custom renderer in Angular

Create a custom cell renderer, and use it in your Angular data grid by declaring it as a function.

[[toc]]

## Example

The following example is an implementation of `@handsontable/angular` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example :angular --html 1 --js 2

@[code](@/content/guides/integrate-with-angular/angular-custom-renderer-example/angular/example1.html)
@[code](@/content/guides/integrate-with-angular/angular-custom-renderer-example/angular/example1.js)

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

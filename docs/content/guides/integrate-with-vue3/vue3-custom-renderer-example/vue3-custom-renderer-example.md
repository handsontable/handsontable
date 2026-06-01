---
type: tutorial
id: uu0rzeo6
title: Custom renderer in Vue 3
metaTitle: Custom cell renderer - Vue 3 Data Grid | Handsontable
description: Create a custom cell renderer, and use it in your Vue 3 data grid by declaring it as a function or as a Vue 3 component.
permalink: /vue3-custom-renderer-example
canonicalUrl: /vue3-custom-renderer-example
react:
  id: ijm6kk3v
  metaTitle: Custom cell renderer - Vue 3 Data Grid | Handsontable
angular:
  id: karjf4av
  metaTitle: Custom cell renderer - Vue 3 Data Grid | Handsontable
vue:
  id: 3a3ut00h
searchCategory: Guides
category: Integrate with Vue 3
---
In this tutorial, you will create a custom cell renderer that displays image URLs as actual images in a Vue 3 application.

[[toc]]

## Overview

You can declare a custom renderer for the `HotTable` component by declaring it as a function in the Handsontable options or creating a rendering component.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

## Declare a renderer as a function

The following example is an implementation of `@handsontable/vue3` with a custom renderer added. It takes an image URL as the input and renders the image in the edited cell.

::: example #example1 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-custom-renderer-example/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-custom-renderer-example/vue/example1.js)

:::

## Declare a renderer as a Vue 3 component

You can use a Vue 3 component as a custom cell renderer by mounting it into the cell's TD element from inside the renderer function. Use Vue 3's `render(vnode, container)` API to mount the component imperatively and reuse the same component instance across re-renders -- Vue patches the existing tree instead of remounting.

The renderer function receives the same arguments as a regular function-based renderer. You build a VNode from your component with `h(Component, props)` and pass it to `render()` together with the TD element. To pass static props alongside cell data, merge them into the second argument of `h()`.

::: example #example2 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-custom-renderer-example/vue/example2.html)
@[code](@/content/guides/integrate-with-vue3/vue3-custom-renderer-example/vue/example2.js)

:::

If your component needs access to a Vue application context -- for example, global components, plugins, or `provide` / `inject` -- create a dedicated app per cell with `createApp(Component, props).mount(td)` instead of `render()`. Track the returned app instances so you can call `app.unmount()` when the grid is destroyed.

## Related articles

**Related guides**

<div class="boxes-list">

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md)

</div>

**APIs**

<div class="boxes-list">

- [BasePlugin](@/api/basePlugin.md)

</div>

**Configuration options**

<div class="boxes-list">

- [renderer](@/api/options.md#renderer)

</div>

**Core methods**

<div class="boxes-list">

- [getCellMeta()](@/api/core.md#getcellmeta)
- [getCellMetaAtRow()](@/api/core.md#getcellmetaatrow)
- [getCellsMeta()](@/api/core.md#getcellsmeta)
- [getCellRenderer()](@/api/core.md#getcellrenderer)
- [setCellMeta()](@/api/core.md#setcellmeta)
- [setCellMetaObject()](@/api/core.md#setcellmetaobject)
- [removeCellMeta()](@/api/core.md#removecellmeta)

</div>

**Hooks**

<div class="boxes-list">

- [afterGetCellMeta](@/api/hooks.md#aftergetcellmeta)
- [afterGetColumnHeaderRenderers](@/api/hooks.md#aftergetcolumnheaderrenderers)
- [afterGetRowHeaderRenderers](@/api/hooks.md#aftergetrowheaderrenderers)
- [afterRenderer](@/api/hooks.md#afterrenderer)
- [beforeGetCellMeta](@/api/hooks.md#beforegetcellmeta)
- [beforeRenderer](@/api/hooks.md#beforerenderer)

</div>

## What you learned

- How to declare a custom renderer function in a Vue 3 application.
- How to read cell values and render HTML elements -- such as images -- inside cells.
- How to assign the renderer to a specific column using the `renderer` option.
- How to mount a Vue 3 component as a custom cell renderer with `render(vnode, td)`.

## Next steps

- [Cell renderer](@/guides/cell-functions/cell-renderer/cell-renderer.md) -- explore the full renderer API.
- [HotColumn component in Vue 3](@/guides/integrate-with-vue3/vue3-hot-column/vue3-hot-column.md) -- assign renderers per column declaratively.
- [Custom editor in Vue 3](@/guides/integrate-with-vue3/vue3-custom-editor-example/vue3-custom-editor-example.md) -- pair your renderer with a custom editor.

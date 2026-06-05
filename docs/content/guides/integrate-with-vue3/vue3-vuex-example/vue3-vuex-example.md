---
type: tutorial
id: pxr5suzy
title: Vuex in Vue 3
metaTitle: Integration with Vuex - Vue 3 Data Grid - Handsontable
description: Use the Vuex state management pattern to maintain the data and configuration options of your Vue 3 data grid.
permalink: /vue3-vuex-example
canonicalUrl: /vue3-vuex-example
react:
  id: z78880e4
  metaTitle: Integration with Vuex - Vue 3 Data Grid - Handsontable
angular:
  id: b16i0n4r
  metaTitle: Integration with Vuex - Vue 3 Data Grid - Handsontable
vue:
  id: tv2zzko8
searchCategory: Guides
category: Integrate with Vue 3
---
In this tutorial, you will connect a Handsontable grid to a Vuex store so that cell changes update shared application state.

[[toc]]

## Example - Vuex store dump

The following example implements the `@handsontable/vue3` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Vuex state manager.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3-vuex

@[code](@/content/guides/integrate-with-vue3/vue3-vuex-example/vue/example1.vue)

:::

## What you learned

- How to connect a Handsontable grid to a Vuex store in a Vue 3 application.
- How to use Vuex getters and mutations to read and write grid data.
- How to propagate cell changes from Handsontable hooks back to the store.

## Next steps

- [Referencing the Handsontable instance in Vue 3](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md) -- access the Handsontable API directly from your component.
- [HotColumn component in Vue 3](@/guides/integrate-with-vue3/vue3-hot-column/vue3-hot-column.md) -- configure columns declaratively alongside your store.
- [Formulas integration in Vue 3](@/guides/integrate-with-vue3/vue3-formulas-example/vue3-formulas-example.md) -- combine Vuex-managed data with formula calculations.

:::: only-for vue

See also [Pinia in Vue 3](@/guides/getting-started/vue3-pinia/vue3-pinia.md) -- the officially recommended state-management library for Vue 3.

::::

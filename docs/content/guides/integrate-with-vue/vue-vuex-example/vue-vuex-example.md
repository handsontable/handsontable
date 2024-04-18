---
id: r6ip0seq
title: Vuex example in Vue 2
metaTitle: Integration with Vuex - Vue 2 Data Grid - Handsontable
description: Use the Vuex state management pattern to maintain the data and configuration options of your Vue 2 data grid.
permalink: /vue-vuex-example
canonicalUrl: /vue-vuex-example
react:
  id: fdtaa1rw
  metaTitle: Integration with Vuex - Vue 2 Data Grid - Handsontable
searchCategory: Guides
category: Integrate with Vue 2
---

# Vuex example in Vue 2

Use the Vuex state management pattern to maintain the data and configuration options of your Vue 2 data grid.

[[toc]]

## Example - Vuex store dump

The following example implements the `@handsontable/vue` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Vuex state manager.

Toggle [`readOnly`](@/api/options.md#readonly) for the entire table.

::: example #example1 :vue-vuex --html 1 --js 2

@[code](@/content/guides/integrate-with-vue/vue-vuex-example/vue/example1.html)
@[code](@/content/guides/integrate-with-vue/vue-vuex-example/vue/example1.js)

:::

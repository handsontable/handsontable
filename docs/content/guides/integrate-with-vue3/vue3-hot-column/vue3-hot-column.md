---
id: l884wwjc
title: Using the `HotColumn` component in Vue 3
metaTitle: HotColumn component - Vue 3 Data Grid | Handsontable
description: Configure the Vue 3 data grid's columns, using the props of the "HotColumn" component. Define a custom cell editor or a custom cell renderer.
permalink: /vue3-hot-column
canonicalUrl: /vue3-hot-column
react:
  id: vevcltww
  metaTitle: HotColumn component - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Using the `HotColumn` component in Vue 3

Configure the Vue 3 data grid's columns, using the props of the `HotColumn` component. Define a custom cell editor or a custom cell renderer.

[[toc]]

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

## Declare column settings

To declare column-specific settings, pass the settings as `hot-column` properties, either separately or wrapped as a `settings` property, exactly as you would for `hot-table`.

::: example #example1 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-hot-column/vue/example1.html)
@[code](@/content/guides/integrate-with-vue3/vue3-hot-column/vue/example1.js)

:::

## Array of objects

To work with an array of objects for the `hot-column` component, you need to provide precise information about the data structure for the columns. To do this, refer to the data for a column in properties as `data`.

::: example #example2 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-hot-column/vue/example2.html)
@[code](@/content/guides/integrate-with-vue3/vue3-hot-column/vue/example2.js)

:::

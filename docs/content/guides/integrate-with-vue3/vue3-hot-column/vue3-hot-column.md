---
type: how-to
id: l884wwjc
title: Using the `HotColumn` component in Vue 3
metaTitle: HotColumn component - Vue 3 Data Grid | Handsontable
description: Configure the Vue 3 data grid's columns, using the props of the "HotColumn" component. Define a custom cell editor or a custom cell renderer.
permalink: /vue3-hot-column
canonicalUrl: /vue3-hot-column
react:
  id: vevcltww
  metaTitle: HotColumn component - Vue 3 Data Grid | Handsontable
angular:
  id: 65dx0xyo
  metaTitle: HotColumn component - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---
HotColumn is a Vue 3 component that lets you define column settings declaratively as child components of HotTable.

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

## Declare a custom editor as a component

You can declare a custom editor by creating a class that extends `TextEditor` and passing it to a `hot-column` via the `editor` prop. The editor's input element uses a `placeholder` attribute to display a hint when the cell value is empty.

::: example #example3 :vue3 --html 1 --js 2

@[code](@/content/guides/integrate-with-vue3/vue3-hot-column/vue/example3.html)
@[code](@/content/guides/integrate-with-vue3/vue3-hot-column/vue/example3.js)

:::

## Result

Using `HotColumn` child components, each column reads its settings declaratively from Vue props rather than from a flat `columns` array, keeping your template in sync with your column configuration.

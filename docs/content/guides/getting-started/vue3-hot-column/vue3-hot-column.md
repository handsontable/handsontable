---
type: how-to
id: h7xv9mwq
title: Using the HotColumn component in Vue 3
metaTitle: HotColumn component - JavaScript Data Grid | Handsontable
description: Configure the Vue 3 data grid's columns, using the props of the "HotColumn" component. Define a custom cell editor or a custom cell renderer.
permalink: /vue-hot-column
canonicalUrl: /vue-hot-column
vue:
  metaTitle: HotColumn component - Vue Data Grid | Handsontable
searchCategory: Guides
onlyFor: vue
category: Getting started
---
HotColumn is a Vue 3 component that lets you define column settings declaratively as child components of HotTable.

[[toc]]

[Find out which Vue 3 versions are supported](@/guides/getting-started/installation/installation.md#supported-versions-of-vue)

## Declare column settings

To declare column-specific settings, pass the settings as `<HotColumn/>` properties, either separately or wrapped as a `settings` property, exactly as you would for `<HotTable/>`.

::: example #example1 :vue3

@[code](@/content/guides/getting-started/vue3-hot-column/vue/example1.vue)

:::

## Array of objects

To work with an array of objects for the `<HotColumn/>` component, you need to provide precise information about the data structure for the columns. To do this, refer to the data for a column in properties as `data`.

::: example #example2 :vue3

@[code](@/content/guides/getting-started/vue3-hot-column/vue/example2.vue)

:::

## Declare a custom editor as a component

You can declare a custom editor by creating a class that extends `TextEditor` and passing it to a `<HotColumn/>` via the `editor` prop. The editor's input element uses a `placeholder` attribute to display a hint when the cell value is empty.

::: example #example3 :vue3

@[code](@/content/guides/getting-started/vue3-hot-column/vue/example3.vue)

:::

## Result

Using `HotColumn` child components, each column reads its settings declaratively from Vue props rather than from a flat `columns` array, keeping your template in sync with your column configuration.

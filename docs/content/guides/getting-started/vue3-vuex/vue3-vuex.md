---
type: tutorial
id: m4v9kp2z
title: Vuex state management
metaTitle: Vuex state management - Vue Data Grid | Handsontable
description: Use the Vuex state management pattern to maintain the data and configuration options of your Vue 3 data grid.
permalink: /vue-vuex
canonicalUrl: /vue-vuex
tags:
  - vuex
  - state management
vue:
  metaTitle: Vuex state management - Vue Data Grid | Handsontable
searchCategory: Guides
onlyFor: vue
category: Getting started
---

In this tutorial, you will connect a Handsontable grid to a Vuex store. You will learn to commit mutations on cell changes and sync grid data with shared application state.

[[toc]]

## Before you begin

- Install [Vuex 4](https://vuex.vuejs.org/) in your Vue 3 project: `npm install vuex@next`.
- Understand how Handsontable handles data: see [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md#understand-binding-as-a-reference).

## Integrate with Vuex

::: tip

Before using any state management library, make sure you know how Handsontable handles data: see the [Binding to data](@/guides/getting-started/binding-to-data/binding-to-data.md#understand-binding-as-a-reference) page.

:::

The following example implements the `@handsontable/vue3` component with a [`readOnly`](@/api/options.md#readonly) toggle switch and the Vuex state manager. Editing a cell commits a mutation to the store, and a live store dump displays the current state below the grid.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation/vue3-installation.md#vue-3-version-support)

::: example #example1 :vue3-vuex

@[code](@/content/guides/getting-started/vue3-vuex/vue/example1.vue)

:::

## What you learned

- How to create a typed Vuex store with `createStore<VuexState>` and define mutations for grid data and settings.
- How to use the `afterChange` hook to commit a Vuex mutation whenever the user edits a cell.
- How to toggle a Handsontable option (`readOnly`) by dispatching a store mutation from a UI control.
- How to subscribe to store changes with `store.subscribe()` to reactively update a live state dump.

## Next steps

- [Pinia state management](@/guides/getting-started/vue3-pinia/vue3-pinia.md) -- use Pinia as a lighter, Vue 3-native alternative to Vuex for managing grid state.
- [Referencing the Handsontable instance in Vue 3](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md) -- access the Handsontable API directly from your component.
- [HotColumn component in Vue 3](@/guides/getting-started/vue3-hot-column/vue3-hot-column.md) -- configure columns declaratively alongside your store.

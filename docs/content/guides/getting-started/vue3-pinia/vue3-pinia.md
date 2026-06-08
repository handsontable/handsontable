---
type: how-to
id: c0y2nwis
title: Pinia in Vue 3
metaTitle: Pinia in Vue 3 - Vue 3 Data Grid | Handsontable
description: Use the Pinia store to maintain the data and configuration options of your Vue 3 data grid.
permalink: /vue-pinia
canonicalUrl: /vue-pinia
vue:
  metaTitle: Pinia in Vue 3 - Vue Data Grid | Handsontable
searchCategory: Guides
onlyFor: vue
category: Getting started
---

Use [Pinia](https://pinia.vuejs.org/) -- the officially recommended state-management library for Vue 3 -- to manage your Handsontable data and settings.

[[toc]]

## Prerequisites

- The `@handsontable/vue3` package installed. See [Installing Handsontable](@/guides/getting-started/installation/installation.md).
- The `pinia` package installed: `npm install pinia`.

## Steps

### 1. Define a Pinia store

Create a store with `defineStore`. The example below defines state that holds the grid data and a `readOnly` flag, plus actions to mutate both.

### 2. Activate Pinia

Because the docs example runner does not call `app.use(pinia)`, activate Pinia at module scope with `setActivePinia(createPinia())` before calling `useStore()`.

### 3. Connect the store to `<HotTable>`

Bind the store state to your `gridSettings` ref and use the `afterChange` hook to write cell edits back to the store.

### 4. React to store changes from the grid

Use Vue's `watch` to observe store state and update the grid when the store changes outside of a direct cell edit -- for example, when a button dispatches an action.

## Example

::: example #example1 :vue3

@[code](@/content/guides/getting-started/vue3-pinia/vue/example1.vue)

:::

## Result

The grid reflects the Pinia store state at all times. Cell edits update the store, and store mutations (for example, toggling `readOnly` or resetting data) are immediately reflected in the grid.

## Related

- [Pinia documentation](https://pinia.vuejs.org/)
- [Vuex in Vue 3](@/guides/getting-started/vue3-vuex/vue3-vuex.md) -- an alternative state management approach using Vuex 4.
- [Instance access in Vue 3](@/guides/getting-started/vue3-hot-reference/vue3-hot-reference.md) -- access the Handsontable API directly from your component.

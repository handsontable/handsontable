---
type: how-to
title: Instance reference
metaTitle: Instance reference - JavaScript Data Grid | Handsontable
description: Reference a Handsontable instance from within a Vue 3 component, to programmatically perform actions such as selecting cells.
permalink: /vue-instance-reference
canonicalUrl: /vue-instance-reference
tags:
  - referring
  - referencing
  - ref
  - instance
vue:
  metaTitle: Instance reference - Vue Data Grid | Handsontable
searchCategory: Guides
onlyFor: vue
category: Getting started
---
Use `useTemplateRef` and the `hotInstance` property to get a reference to the Handsontable instance from a Vue 3 component, then call any API method on it.

[[toc]]

## Use Handsontable's API

You can programmatically change the internal state of Handsontable beyond what's possible with props. To do that, call API methods of the relevant Handsontable instance associated with your instance of the [`HotTable`](@/guides/getting-started/installation/installation.md#use-the-hottable-component) component.

In `<script setup>`, create a template reference with [`useTemplateRef`](https://vuejs.org/api/composition-api-helpers.html#usetemplateref) and give the `HotTable` component a `ref` attribute whose value matches the reference key. After the component mounts, the Handsontable instance is available under the `hotInstance` property of that reference.

[Find out which Vue 3 versions are supported](@/guides/getting-started/installation/installation.md#supported-versions-of-vue)

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const selectCell = () => {
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
};
</script>

<template>
  <HotTable ref="hotTableRef" :settings="hotSettings" />
</template>
```

The string passed to `useTemplateRef()` must match the `ref` attribute on `HotTable`. Access the grid through `hotTableRef.value?.hotInstance`.

The following live example selects cell B2 when you click the button.

::: example #example1 :vue3

@[code](@/content/guides/getting-started/vue3-hot-reference/vue/example1.vue)

:::

## Vue versions before 3.5

`useTemplateRef` requires Vue 3.5 or newer. On earlier versions, use the `ref` function instead. Declare a `ref` initialized to `null`, then give the `HotTable` component a `ref` attribute whose value matches the variable name.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';

const hotTableRef = ref<InstanceType<typeof HotTable> | null>(null);

const selectCell = () => {
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
}
</script>

<template>
  <HotTable ref="hotTableRef" :settings="hotSettings" />
</template>
```

## Result

Your Vue 3 component now holds a reference to the Handsontable instance. You can call any Handsontable API method on that instance -- such as `selectCell()` or `getPlugin()` -- from event handlers or lifecycle hooks.

---
type: how-to
title: Use Handsontable in Nuxt
metaTitle: Use Handsontable in Nuxt - JavaScript Data Grid | Handsontable
description: Set up Handsontable in a Nuxt 3 application using the ClientOnly component or the .client.vue suffix to avoid SSR errors.
permalink: /vue-nuxt
canonicalUrl: /vue-nuxt
tags:
  - nuxt
  - ssr
  - client-only
vue:
  metaTitle: Use Handsontable in Nuxt - Vue 3 Data Grid | Handsontable
searchCategory: Guides
onlyFor: vue
category: Getting started
---

Handsontable relies on browser APIs that are not available during server-side rendering. This page explains how to integrate Handsontable into a Nuxt 3 application without SSR errors.

[[toc]]

## Why Handsontable needs client-side rendering

Nuxt 3 renders Vue components on the server before sending HTML to the browser. That server environment has no DOM -- no `window`, no `document`, no `HTMLElement`. Handsontable's initialization code and the underlying Walkontable rendering engine access these browser globals.

When Nuxt runs a component that imports or initializes Handsontable on the server, you get errors like:

```
ReferenceError: window is not defined
```

The fix is to keep all Handsontable code out of the server rendering path.

## Prerequisites

- Nuxt 3 project set up and running.
- Handsontable and the Vue 3 wrapper installed:

  ```bash
  npm install handsontable @handsontable/vue3
  ```

## Using `<ClientOnly>`

Nuxt's built-in `<ClientOnly>` component prevents its children from rendering on the server. Wrap your `<HotTable>` in it:

```vue
<template>
  <ClientOnly>
    <HotTable :settings="gridSettings" />
    <template #fallback>
      <p>Loading the data grid...</p>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const gridSettings = ref<GridSettings>({
  data: [
    ['Mercedes', 'Germany', 2000, 2023],
    ['BMW', 'Germany', 1998, 2024],
    ['Toyota', 'Japan', 2001, 2023],
    ['Honda', 'Japan', 1999, 2022],
    ['Ford', 'USA', 1997, 2024],
  ],
  colHeaders: ['Brand', 'Country', 'Since', 'Until'],
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>
```

The `#fallback` slot renders on the server in place of the grid. Use it to show a placeholder or skeleton so the page has visible content before the browser takes over.

::: tip

`<ClientOnly>` prevents **rendering** on the server but the `import` statements still execute on the server. If you see a `window is not defined` error at import time rather than render time, use the `.client.vue` approach described below.

:::

## Using the `.client.vue` suffix

Nuxt treats any component file ending in `.client.vue` as a client-only component -- it is excluded from the server bundle entirely, including its imports. This is the most robust option when a package accesses browser APIs at module load time.

Create a wrapper component named with the `.client.vue` suffix:

```
components/
└── HandsonGrid.client.vue
```

```vue
<!-- components/HandsonGrid.client.vue -->
<template>
  <HotTable :settings="props.settings" />
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const props = defineProps<{
  settings: GridSettings;
}>();
</script>
```

Use it in your page without any additional wrapper:

```vue
<template>
  <HandsonGrid :settings="gridSettings" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { GridSettings } from 'handsontable/settings';

const gridSettings = ref<GridSettings>({
  data: [
    ['Mercedes', 'Germany', 2000, 2023],
    ['BMW', 'Germany', 1998, 2024],
    ['Toyota', 'Japan', 2001, 2023],
    ['Honda', 'Japan', 1999, 2022],
    ['Ford', 'USA', 1997, 2024],
  ],
  colHeaders: ['Brand', 'Country', 'Since', 'Until'],
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>
```

::: tip

The `.client.vue` convention only works with Nuxt auto-imports and `#components` imports. If you import the component using its full file path (for example, `import HandsonGrid from '~/components/HandsonGrid.client.vue'`), Nuxt does not apply the client-only behavior.

:::

## `nuxt.config.ts` notes

For most Nuxt 3 projects (which use Vite by default), no extra configuration is needed. `<ClientOnly>` or `.client.vue` is sufficient.

In rare cases -- for example, when using a Nuxt plugin that imports Handsontable in a server-side context -- you can add the packages to `build.transpile` as a fallback:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  build: {
    transpile: ['handsontable', '@handsontable/vue3'],
  },
});
```

Start with `<ClientOnly>` or `.client.vue` before reaching for this option.

## Result

Handsontable renders in the browser. The SSR pass shows the `#fallback` content (with `<ClientOnly>`) or nothing (with `.client.vue`), and the grid initializes once the Vue component mounts on the client.

<div class="boxes-list gray">

- [Working example with Nuxt](https://handsontable.com/codesandbox-vm?example-dir=nuxt&handsontable-version={{$currentVersion}})

</div>

## Related

- [Vue 3 installation](@/guides/getting-started/installation/installation.md)

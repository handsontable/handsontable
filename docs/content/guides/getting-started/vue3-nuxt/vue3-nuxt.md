---
type: how-to
title: Use Handsontable in Nuxt
metaTitle: Use Handsontable in Nuxt | Handsontable DataGrid for JavaScript
description: Set up Handsontable DataGrid in a Nuxt application, and optionally render it on the client only with the ClientOnly component or the .client.vue suffix.
permalink: /vue-nuxt
canonicalUrl: /vue-nuxt
tags:
  - nuxt
  - ssr
  - client-only
  - hydration
vue:
  metaTitle: Use Handsontable in Nuxt | Handsontable DataGrid for Vue
searchCategory: Guides
onlyFor: vue
category: Getting started
menuTag: updated
---

Handsontable DataGrid works in a Nuxt application with server-side rendering (SSR). This page explains how Handsontable behaves during SSR, and how to render the grid on the client only when you want a placeholder or a smaller server bundle.

[[toc]]

## Prerequisites

- Nuxt 3 or Nuxt 4 project set up and running.
- Handsontable and the Vue 3 wrapper installed:

  ```bash
  npm install handsontable @handsontable/vue3
  ```

## How Handsontable behaves with SSR

Nuxt renders Vue components on the server before sending HTML to the browser. When it renders a `<HotTable>` component on the server:

- The server renders an empty container `<div>`.
- The browser hydrates the page and mounts the grid into that container.

You can import `handsontable` and `@handsontable/vue3`, and call `registerAllModules()`, in server code. Handsontable does not need `<ClientOnly>` or a `.client.vue` file to run in Nuxt.

::: tip

The `@handsontable/vue3` wrapper adds an automatically generated `id` attribute to the container only after the component mounts in the browser, so the server-rendered markup and the first client render match. Earlier versions of the wrapper generated that `id` on the server too, which made Vue log a `Hydration attribute mismatch` warning. If you use such a version, pass an explicit `id` to `<HotTable>`, or use `<ClientOnly>`.

:::

## Render the grid on the client only

Rendering the grid on the client only is optional. Use it when you want a placeholder in the server-rendered HTML, or when you want to keep the grid out of the server bundle.

### Using `<ClientOnly>`

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

### Using the `.client.vue` suffix

Nuxt treats any component file ending in `.client.vue` as a client-only component. It is excluded from the server bundle entirely, including its imports. Use it when you want to keep all Handsontable code out of the server bundle.

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

For most Nuxt projects, no extra configuration is needed.

In rare cases, for example when a Nuxt plugin imports Handsontable in a server-side context and your build fails to resolve the packages, you can add them to `build.transpile` as a fallback:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  build: {
    transpile: ['handsontable', '@handsontable/vue3'],
  },
});
```

Try the default setup before you reach for this option.

## Result

Handsontable renders in the browser. The SSR pass renders an empty container, the `#fallback` content (with `<ClientOnly>`), or nothing (with `.client.vue`). The grid initializes once the Vue component mounts on the client.

<div class="boxes-list gray">

- [Working example with Nuxt](https://handsontable.com/codesandbox-vm?example-dir=nuxt&handsontable-version={{$currentVersion}})

</div>

## Related

- [Vue 3 installation](@/guides/getting-started/installation/installation.md)

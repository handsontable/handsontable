---
id: 6sl4ak1f
title: Installation in Vue 3
metaTitle: Installation - Vue 3 Data Grid | Handsontable
description: Install Handsontable's Vue 3 wrapper via npm, import the stylesheets, and get your application up and running.
permalink: /vue3-installation
canonicalUrl: /vue3-installation
react:
  id: fsggsowh
  metaTitle: Installation - Vue 3 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 3
---

# Installation in Vue 3

Install Handsontable's Vue 3 wrapper via npm, import the stylesheets, and get your application up and running.

[[toc]]

## Vue 3 version support

Handsontable supports the following Vue 3 versions:

| Handsontable version | Vue 3 version      |
| -------------------- | ------------------ |
| `11.0.0` and lower   | No Vue 3 support   |
| `11.1.0` and higher  | `3.2.0` and higher |

## Install with npm

This component needs the Handsontable library to work. Use npm to install the packages.

```bash
npm install handsontable @handsontable/vue3
```

## Basic usage

```js
<template>
  <div class="ht-theme-main-dark-auto">
    <hot-table :data="data" :rowHeaders="true" :colHeaders="true"></hot-table>
  </div>
</template>

<script>
  import { defineComponent } from 'vue';
  import { HotTable } from '@handsontable/vue3';
  import { registerAllModules } from 'handsontable/registry';
  import 'handsontable/styles/handsontable.min.css';
  import 'handsontable/styles/ht-theme-main.min.css';

  // register Handsontable's modules
  registerAllModules();

  export default defineComponent({
    data() {
      return {
        data: [
          ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
          ['2016', 10, 11, 12, 13],
          ['2017', 20, 11, 14, 13],
          ['2018', 30, 15, 12, 13]
        ],
      };
    },
    components: {
      HotTable,
    }
  });
</script>
```

::: tip

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/integrate-with-vue3/vue3-modules/vue3-modules.md) that you need.

:::

## Related API reference

- Configuration options:
  - [`maxCols`](@/api/options.md#maxcols)
  - [`maxRows`](@/api/options.md#maxrows)
  - [`minCols`](@/api/options.md#mincols)
  - [`minRows`](@/api/options.md#minrows)
  - [`minSpareCols`](@/api/options.md#minsparecols)
  - [`minSpareRows`](@/api/options.md#minsparerows)
  - [`startCols`](@/api/options.md#startcols)
  - [`startRows`](@/api/options.md#startrows)
- Hooks:
  - [`afterInit`](@/api/hooks.md#afterinit)
  - [`beforeInit`](@/api/hooks.md#beforeinit)
  - [`beforeInitWalkontable`](@/api/hooks.md#beforeinitwalkontable)
  - [`construct`](@/api/hooks.md#construct)

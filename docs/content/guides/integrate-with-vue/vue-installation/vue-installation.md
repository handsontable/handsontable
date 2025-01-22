---
id: m1qrgnlo
title: Installation in Vue 2
metaTitle: Installation - Vue 2 Data Grid | Handsontable
description: Install Handsontable's Vue 2 wrapper via npm, import the stylesheets, and get your application up and running.
permalink: /vue-installation
canonicalUrl: /vue-installation
react:
  id: psozke11
  metaTitle: Installation - Vue 2 Data Grid | Handsontable
searchCategory: Guides
category: Integrate with Vue 2
---

# Installation in Vue 2

Install Handsontable's Vue 2 wrapper via npm, import the stylesheets, and get your application up and running.

[[toc]]

## Install with npm

This component needs the Handsontable library to work. Use npm to install the packages.

```bash
npm install handsontable @handsontable/vue
```

## Basic usage

```js
<template>
  <div class="ht-theme-main-dark-auto">
    <hot-table :data="data" :rowHeaders="true" :colHeaders="true"></hot-table>
  </div>
</template>

<script>
  import { HotTable } from '@handsontable/vue';
  import { registerAllModules } from 'handsontable/registry';
  import 'handsontable/styles/handsontable.min.css';
  import 'handsontable/styles/ht-theme-main.min.css';

  // register Handsontable's modules
  registerAllModules();

  export default {
    data: function() {
      return {
        data: [
          ["", "Ford", "Volvo", "Toyota", "Honda"],
          ["2016", 10, 11, 12, 13],
          ["2017", 20, 11, 14, 13],
          ["2018", 30, 15, 12, 13]
        ],
      };
    },
    components: {
      HotTable
    }
  }
</script>
```

::: tip

You can reduce the size of your bundle by importing and registering only the
[modules](@/guides/integrate-with-vue/vue-modules/vue-modules.md) that you need.

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

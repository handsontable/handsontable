---
title: 'Installation in Vue 3'
metaTitle: 'Installation in Vue 3 - Guide - Handsontable Documentation'
permalink: /next/vue3-installation
canonicalUrl: /vue3-installation
---

# Installation in Vue 3

[[toc]]

## Overview

Vue 3 installation and basic usage guide.

### Vue 3 version support

To find out which Vue 3 versions are supported by Handsontable, see the table below:

::: details Vue 3 version support

| Handsontable version | Vue 3 version      |
| -------------------- | ------------------ |
| `11.0.0` and lower   | No Vue 3 support   |
| `11.1.0` and higher  | `3.2.0` and higher |

:::

## Install with npm

This component needs the Handsontable library to work. Use npm to install the packages.

```bash
npm install handsontable @handsontable/vue3
```

## Basic usage

```js
<template>
  <hot-table :data="data" :rowHeaders="true" :colHeaders="true"></hot-table>
</template>

<script>
  import { defineComponent } from 'vue';
  import { HotTable } from '@handsontable/vue3';
  import { registerAllModules } from 'handsontable/registry';

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

<style src="handsontable/dist/handsontable.full.css"></style>
```

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
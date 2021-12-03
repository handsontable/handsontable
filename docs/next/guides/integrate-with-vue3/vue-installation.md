---
title: 'Installation with Vue 3'
metaTitle: 'Installation with Vue 3 - Guide - Handsontable Documentation'
permalink: /next/vue3-installation
canonicalUrl: /vue3-installation
---

# Installation with Vue 3

[[toc]]

## Overview

Vue 3 installation and basic usage guide.

## Install with npm

This component needs the Handsontable library to work. Use [npm](https://www.npmjs.com/package/@handsontable/vue3) to install the packages.

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

---
title: 'Installation in Vue 2'
metaTitle: 'Installation in Vue 2 - Guide - Handsontable Documentation'
permalink: /vue-installation
canonicalUrl: /vue-installation
---

# Installation in Vue 2

[[toc]]

## Overview

Vue 2 installation and basic usage guide.

## Install with npm

This component needs the Handsontable library to work. Use [npm](https://www.npmjs.com/package/@handsontable/vue) to install the packages.

```bash
npm install handsontable @handsontable/vue
```

## Basic usage

```js
<template>
  <hot-table :data="data" :rowHeaders="true" :colHeaders="true"></hot-table>
</template>

<script>
  import { HotTable } from '@handsontable/vue';
  import { registerAllModules } from 'handsontable/registry';

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

<style src="../node_modules/handsontable/dist/handsontable.full.css"></style>
```

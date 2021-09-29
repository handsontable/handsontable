---
title: Vue installation
metaTitle: Vue installation - Guide - Handsontable Documentation
permalink: /10.0/vue-installation
canonicalUrl: /vue-installation
---

# Installation

[[toc]]

## Overview

Vue installation and basic usage guide.

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

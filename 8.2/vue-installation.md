---
title: Installation
permalink: /8.2/vue-installation
canonicalUrl: /vue-installation
---

# {{ $frontmatter.title }}

[[toc]]

**Handsontable for Vue** is the official wrapper for Handsontable, a JavaScript data grid component with a spreadsheet look & feel. It easily integrates with any data source and comes with lots of useful features like data binding, validation, sorting or powerful context menu.

## Installation

This component needs the Handsontable library to work. We suggest using [npm](https://www.npmjs.com/package/@handsontable/vue) to install the package.

```
npm install handsontable @handsontable/vue
```

## Basic usage

Vue Component

```
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

<style src="../node_modules/handsontable/dist/handsontable.full.css"></style>`
```

## License

Handsontable for Vue wrapper is released under [the MIT license](https://github.com/handsontable/vue-handsontable-official/blob/master/LICENSE) but under the hood it uses Handsontable, which is [dual-licensed](licensing.md). You can either use it for free in all your non-commercial projects or purchase a commercial license.

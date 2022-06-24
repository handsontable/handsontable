---
title: 'Referencing the Handsontable instance in Vue 3'
metaTitle: 'Referencing the Handsontable instance in Vue 3 - Guide - Handsontable Documentation'
permalink: /vue3-hot-reference
canonicalUrl: /vue3-hot-reference
---

# Referencing the Handsontable instance in Vue 3

[[toc]]

## Overview

The following example implements the `@handsontable/vue3`, showing how to reference the Handsontable instance from the wrapper component.

[Find out which Vue 3 versions are supported &#8594;](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Example

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table ref="hotTableComponent" :settings="hotSettings"></hot-table><br/>
  <button v-on:click="swapHotData" class="controls">Load new data!</button>
</div>
```
```js
import { createApp } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { createSpreadsheetData } from './helpers';

// register Handsontable's modules
registerAllModules();

const app = createApp({
  data() {
    return {
      hotSettings: {
        data: createSpreadsheetData(4, 4),
        colHeaders: true,
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    };
  },
  methods: {
    swapHotData: function() {
      // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
      this.$refs.hotTableComponent.hotInstance.loadData([['new', 'data']]);
    }
  },
  components: {
    HotTable,
  }
});

app.mount('#example1');
```
:::

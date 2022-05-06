---
title: 'Basic example in Vue 3'
metaTitle: 'Basic example in Vue 3 - Guide - Handsontable Documentation'
permalink: /12.0/vue3-simple-example
canonicalUrl: /vue3-simple-example
---

# Basic example in Vue 3

## Overview

The following example is a simple implementation of the `@handsontable/vue3` component.

[Find out which Vue 3 versions are supported &#8594;](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Example

In this example, a `div` element of `id="example1"` where the `@handsontable/vue3` component will be rendered.

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
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
        data: createSpreadsheetData(6, 10),
        colHeaders: true,
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    };
  },
  components: {
    HotTable,
  }
});

app.mount('#example1');
```
:::

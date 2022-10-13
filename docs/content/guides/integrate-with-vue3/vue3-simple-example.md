---
title: Basic example in Vue 3
metaTitle: Basic example - Vue 3 Data Grid | Handsontable
description: Start with a basic example of the Vue 3 data grid, using component props for configuration and external control.
permalink: /vue3-basic-example
canonicalUrl: /vue3-basic-example
searchCategory: Guides
---

# Basic example in Vue 3

Start with a basic example of the Vue 3 data grid, using component props for configuration and external control.

[[toc]]

## Example

The following example is a simple implementation of the `@handsontable/vue3` component.

In this example, a `div` element of `id="example1"` where the `@handsontable/vue3` component will be rendered.

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

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

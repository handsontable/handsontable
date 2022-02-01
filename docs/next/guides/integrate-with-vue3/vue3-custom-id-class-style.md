---
title: 'Custom ID, Class, Style and other attributes in Vue 3'
metaTitle: 'Custom ID, Class, Style and other attributes in Vue 3 - Guide - Handsontable Documentation'
permalink: /next/vue3-custom-id-class-style
canonicalUrl: /vue3-custom-id-class-style
---

# Custom ID, Class, Style, and other attributes in Vue 3

## Overview

Custom `id`, `class`, `style`, and other attributes can be passed into the `hot-table` wrapper element.
Each of them will be applied to the root Handsontable element, allowing further customization of the table.

[Find out which Vue 3 versions are supported &#8594;](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Example

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table :id="id" :class="className" :style="style" :settings="hotSettings"></hot-table>
</div>
```

```js
import { createApp } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const app = createApp({
  data() {
    return {
      hotSettings: {
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        stretchH: 'all',
        licenseKey: 'non-commercial-and-evaluation'
      },
      id: 'my-custom-id',
      className: 'my-custom-classname',
      style: 'height: 142px; overflow: hidden; border: 1px solid red;'
    }
  },
  components: {
    HotTable,
  }
});

app.mount('#example1');
```
:::

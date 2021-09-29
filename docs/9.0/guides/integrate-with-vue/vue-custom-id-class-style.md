---
title: Custom ID, Class, Style and other attributes
metaTitle: Custom ID, Class, Style and other attributes - Guide - Handsontable Documentation
permalink: /9.0/vue-custom-id-class-style
canonicalUrl: /vue-custom-id-class-style
---

# Custom ID, Class, Style, and other attributes

## Overview

Custom `id`, `class`, `style`, and other attributes can be passed into the `hot-table` wrapper element.
Each of them will be applied to the root Handsontable element, allowing further customization of the table.

## Example

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table :id="id" :class="className" :style="style" :settings="hotSettings"></hot-table>
</div>
```

```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';

new Vue({
  el: '#example1',
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
    HotTable
  }
});
```
:::

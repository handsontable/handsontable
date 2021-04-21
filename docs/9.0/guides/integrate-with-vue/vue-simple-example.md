---
title: Basic example
permalink: /9.0/vue-simple-example
canonicalUrl: /vue-simple-example
---

# Basic example

A simple implementation of the `@handsontable/vue` component.

A `div` element of `id="example"` where the `@handsontable/vue` component will be rendered.

::: example #example1 :vue --html 1 --js 5 
```html
<div id="example1" class="hot">
    <hot-table :settings="hotSettings"></hot-table>
</div>
```

An implementation of the component.

```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data: function() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(6, 10),
        colHeaders: true,
        licenseKey: 'non-commercial-and-evaluation'
      }
    }
  },
  components: {
    HotTable
  }
});
```
:::

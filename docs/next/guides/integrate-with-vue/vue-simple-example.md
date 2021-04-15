---
title: Basic example
permalink: /next/vue-simple-example
canonicalUrl: /vue-simple-example
---

# {{ $frontmatter.title }}

A simple implementation of the `@handsontable/vue` component.

A `div` element of `id="example"` where the `@handsontable/vue` component will be rendered.

```html
<hot-table :settings="hotSettings"></hot-table>
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

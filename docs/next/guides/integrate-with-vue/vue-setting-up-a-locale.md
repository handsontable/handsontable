---
title: Setting up a locale
metaTitle: Setting up a locale - Guide - Handsontable Documentation
permalink: /next/vue-setting-up-a-locale
canonicalUrl: /vue-setting-up-a-locale
---

# Setting up a locale

## Overview

The following example shows a Handsontable instance with locales set up in Vue.

## Example

::: example #example1 :vue-numbro --html 1 --js 2
```html
<div id="example1">
  <hot-table :data="hotData" :settings="settings">
    <hot-column
      title="Product name"
      data="productName"
      width="120"
      read-only="true"
    ></hot-column>
    <hot-column
      title="Price in Japan"
      type="numeric"
      :numeric-format="formatJP"
      data="JP_price"
      width="120"
    ></hot-column>
    <hot-column
      title="Price in Turkey"
      data="TR_price"
      type="numeric"
      :numeric-format="formatTR"
      width="120"
    ></hot-column>
  </hot-table>
</div>
```

```js
import Vue from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue';
import 'handsontable/dist/handsontable.min.css';
import numbro from 'numbro';
import languages from 'numbro/dist/languages.min.js';

// register the languages you need
numbro.registerLanguage(languages['ja-JP']);
numbro.registerLanguage(languages['tr-TR']);

new Vue({
  el: '#example1',
  data() {
    return {
      formatJP: {
        pattern: '0,0.00 $',
        culture: 'ja-JP',
      },
      formatTR: {
        pattern: '0,0.00 $',
        culture: 'tr-TR',
      },
      hotData: [
        {
          productName: 'Product A',
          JP_price: 1.32,
          TR_price: 100.56,
        },
        {
          productName: 'Product B',
          JP_price: 2.22,
          TR_price: 453.5,
        },
        {
          productName: 'Product C',
          JP_price: 3.1,
          TR_price: 678.1,
        },
      ],
      settings: {
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    };
  },
  components: {
    HotTable,
    HotColumn,
  },
});
```
:::

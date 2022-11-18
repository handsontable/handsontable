---
title: Using the `HotColumn` component in Vue 3
metaTitle: HotColumn component - Vue 3 Data Grid | Handsontable
description: Configure the Vue 3 data grid's columns, using the props of the "HotColumn" component. Define a custom cell editor or a custom cell renderer.
permalink: /vue3-hot-column
canonicalUrl: /vue3-hot-column
searchCategory: Guides
---

# Using the `HotColumn` component in Vue 3

Configure the Vue 3 data grid's columns, using the props of the `HotColumn` component. Define a custom cell editor or a custom cell renderer.

[[toc]]

[Find out which Vue 3 versions are supported](@/guides/integrate-with-vue3/vue3-installation.md#vue-3-version-support)

## Declare column settings

To declare column-specific settings, pass the settings as `hot-column` properties, either separately or wrapped as a `settings` property, exactly as you would for `hot-table`.

::: example #example1 :vue3 --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings">
    <hot-column title="First column header">
    </hot-column>
    <hot-column :settings="secondColumnSettings" read-only="true">
    </hot-column>
  </hot-table>
</div>
```

```js
import { createApp } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable/base';

// register Handsontable's modules
registerAllModules();

const app = createApp({
  data() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation',
      },
      secondColumnSettings: {
        title: 'Second column header',
      },
    };
  },
  components: {
    HotTable,
    HotColumn,
  }
});

app.mount('#example1');
```
:::

## Array of objects

To work with an array of objects for the `hot-column` component, you need to provide precise information about the data structure for the columns. To do this, refer to the data for a column in properties as `data`.

::: example #example2 :vue3 --html 1 --js 2
```html
<div id="example2">
  <hot-table :data="hotData" :settings="settings">
    <hot-column title="ID" data="id">
    </hot-column>
    <hot-column :settings="secondColumnSettings" read-only="true" data="name">
    </hot-column>
    <hot-column title="Price" data="payment.price">
    </hot-column>
    <hot-column title="Currency" data="payment.currency">
    </hot-column>
  </hot-table>
</div>
```
```js
import { createApp } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';

const app = createApp({
  data() {
    return {
      hotData: [
        { id: 1, name: 'Table tennis racket', payment: { price: 13, currency: 'PLN' } },
        { id: 2, name: 'Outdoor game ball', payment: { price: 14, currency: 'USD' } },
        { id: 3, name: 'Mountain bike', payment: { price: 300, currency: 'USD' } }
      ],
      secondColumnSettings: {
        title: 'Second column header'
      },
      settings: {
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      },
    };
  },
  components: {
    HotTable,
    HotColumn,
  }
});

app.mount('#example2');
```
:::

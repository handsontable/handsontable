---
title: Referencing the Handsontable instance in Vue 2
metaTitle: Referencing Handsontable - Vue 2 Data Grid | Handsontable
description: Reference the Handsontable instance from a Vue 2 component to programmatically perform actions such as reloading the data in your data grid.
permalink: /vue-hot-reference
canonicalUrl: /vue-hot-reference
searchCategory: Guides
---

# Referencing the Handsontable instance in Vue 2

Reference the Handsontable instance from a Vue 2 component to programmatically perform actions such as reloading the data in your data grid.

[[toc]]

## Example

The following example implements the `@handsontable/vue`, showing how to reference the Handsontable instance from the wrapper component.

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table ref="hotTableComponent" :settings="hotSettings"></hot-table><br/>
  <button v-on:click="swapHotData" class="controls">Load new data</button>
</div>
```
```js
import { HotTable } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = {
  data: function() {
    return {
      hotSettings: {
        data: [
          ['A1', 'B1', 'C1', 'D1'],
          ['A2', 'B2', 'C2', 'D2'],
          ['A3', 'B3', 'C3', 'D3'],
          ['A4', 'B4', 'C4', 'D4'],
        ],
        colHeaders: true,
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    }
  },
  methods: {
    swapHotData: function() {
      // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
      this.$refs.hotTableComponent.hotInstance.loadData([['new', 'data']]);
    }
  },
  components: {
    HotTable
  }
}

export default ExampleComponent;

/* start:non-previewable */
new Vue({
  ...ExampleComponent,
  el: '#example1',
});
/* end:non-previewable */
```
:::

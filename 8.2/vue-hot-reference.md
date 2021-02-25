---
title: Referencing the Handsontable instance
permalink: /8.2/vue-hot-reference
---

# {{ $frontmatter.title }}

[[toc]]

An implementation of the `@handsontable/vue` explaining how to reference the Handsontable instance from the wrapper component.

```html
<div id="example1" class="hot">
  <hot-table ref="hotTableComponent" :settings="hotSettings"></hot-table><br/>
  <button v-on:click="swapHotData">Load new data!</button>
</div>
```
```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data: function() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        colHeaders: true
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
});
```

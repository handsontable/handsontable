---
title: Basic example in Vue 2
metaTitle: Basic example - Vue 2 Data Grid | Handsontable
description: Start with a basic example of the Vue 2 data grid, using component props for configuration and external control.
permalink: /vue-basic-example
canonicalUrl: /vue-basic-example
searchCategory: Guides
---

# Basic example in Vue 2

Start with a basic example of the Vue 2 data grid, using component props for configuration and external control.

[[toc]]

## Example

In this example, a `div` element of `id="example1"` where the `@handsontable/vue` component will be rendered.

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
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
          ['', 'Ford', 'Volvo', 'Toyota', 'Honda'],
          ['2016', 10, 11, 12, 13],
          ['2017', 20, 11, 14, 13],
          ['2018', 30, 15, 12, 13]
        ],
        colHeaders: true,
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation'
      }
    };
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

---
title: Custom ID, Class, Style and other attributes in Vue 2
metaTitle: Custom ID, class, and style - Vue 2 Data Grid | Handsontable
description: Pass a custom ID, class, and style to the "HotTable" component, to further customize your Vue 2 data grid.
permalink: /vue-custom-id-class-style
canonicalUrl: /vue-custom-id-class-style
searchCategory: Guides
---

# Custom ID, class, style, and other attributes in Vue 2

Pass a custom ID, class, and style to the `HotTable` component, to further customize your Vue 2 data grid.

[[toc]]

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
import { HotTable } from '@handsontable/vue';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = {
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
}

export default ExampleComponent;

/* start:skip-in-preview */
new Vue({
  ...ExampleComponent,
  el: '#example1',
});
/* end:skip-in-preview */
```
:::

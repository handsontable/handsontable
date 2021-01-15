---
id: frameworks-wrapper-for-vue-custom-id-class-style
title: Custom ID, Class, Style and other attributes
sidebar_label: Custom ID, Class, Style and other attributes
slug: /frameworks-wrapper-for-vue-custom-id-class-style
---

You can easily pass `id`, `class`, `style` and other attributes to the `hot-table` wrapper element.
Each of them will be applied to the root Handsontable element, allowing further customization of the table.

```
<div id="example1" class="hot"> <hot-table :id="id" :class="className" :style="style" :settings="hotSettings"></hot-table> </div>

Edit

import Vue from 'vue'; import { HotTable } from '@handsontable/vue'; new Vue({ el: '#example1', data: function() { return { hotSettings: { startRows: 5, startCols: 5, colHeaders: true, stretchH: 'all' }, id: 'my-custom-id', className: 'my-custom-classname', style: 'width: 300px; height: 142px; overflow: hidden; border: 1px solid red;' } }, components: { HotTable } });
```

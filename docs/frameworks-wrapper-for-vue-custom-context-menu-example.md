---
id: frameworks-wrapper-for-vue-custom-context-menu-example
title: Custom Context Menu example
sidebar_label: Custom Context Menu example
slug: /frameworks-wrapper-for-vue-custom-context-menu-example
---

An implementation of the `@handsontable/vue` component with a custom Context Menu added.

```
<div id="example1" class="hot"> <hot-table :settings="hotSettings"></hot-table> </div>
```

Edit

```
import Vue from 'vue'; import { HotTable } from '@handsontable/vue'; import Handsontable from 'handsontable'; new Vue({ el: '#example1', data: function() { return { hotSettings: { data: Handsontable.helper.createSpreadsheetData(5, 5), colHeaders: true, contextMenu: { items: { 'row\_above': { name: 'Insert row above this one (custom name)' }, 'row\_below': {}, 'separator': Handsontable.plugins.ContextMenu.SEPARATOR, 'clear\_custom': { name: 'Clear all cells (custom)', callback: function() { this.clear(); } } } } } } }, components: { HotTable } });
```

[Edit this page](https://github.com/handsontable/docs/edit/8.2.0/tutorials/wrapper-for-vue-custom-context-menu-example.html)

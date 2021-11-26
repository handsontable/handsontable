---
title: Custom context menu example
metaTitle: Custom context menu example - Guide - Handsontable Documentation
permalink: /10.0/vue-custom-context-menu-example
canonicalUrl: /vue-custom-context-menu-example
---

# Custom context menu example

## Overview

The following example implements the `@handsontable/vue` component, adding a custom Context Menu.

## Example

::: example #example1 :vue --html 1 --js 2
```html
<div id="example1">
  <hot-table :settings="hotSettings"></hot-table>
</div>
```
```js
import Vue from 'vue';
import { HotTable } from '@handsontable/vue';
import Handsontable from 'handsontable';

new Vue({
  el: '#example1',
  data() {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: {
          items: {
            'row_above': {
              name: 'Insert row above this one (custom name)'
            },
            'row_below': {},
            'separator': Handsontable.plugins.ContextMenu.SEPARATOR,
            'clear_custom': {
              name: 'Clear all cells (custom)',
              callback() {
                this.clear();
              }
            }
          }
        },
        height: 'auto',
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

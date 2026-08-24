<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable/base';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const data: (string | number)[][] = [
  ['SKU-4821', 'Wireless Mouse', 128, 'Electronics'],
  ['SKU-0093', 'Desk Lamp', 42, 'Home Goods'],
  ['SKU-7734', 'USB-C Cable', 310, 'Electronics'],
  ['SKU-2210', 'Notebook Set', 87, 'Office Supplies'],
  ['SKU-5567', 'Water Bottle', 156, 'Outdoor'],
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['SKU', 'Product', 'Quantity', 'Category'],
  columns: [{}, {}, { type: 'numeric' }, {}],
  height: 'auto',
  afterInit(this: Handsontable) {
    // get the `grid` context from the `ShortcutManager` API
    const gridContext = this.getShortcutManager().getContext('grid');

    if (!gridContext) {
      return;
    }

    // register a custom keyboard shortcut in the `grid` context:
    // pressing Control/Meta+Enter inserts a new row below the selected cell
    gridContext.addShortcut({
      keys: [['control/meta', 'enter']],
      group: 'insertRowBelow',
      callback: () => {
        const selected = this.getSelectedRangeLast();

        if (!selected || selected.highlight.row === null) {
          return;
        }

        this.alter('insert_row_below', selected.highlight.row);
      },
    });
  },
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Ships in recyclable packaging. Harbor Goods needs ten days to restock this item, so order early.'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Available in black and silver. The silver version is on backorder until the end of the month.'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Assembly required. Cascade Distributors includes a hex key and a printed guide in the box.'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'In stock.'],
  ],
  colHeaders: ['SKU', 'Product', 'Supplier', 'Note'],
  colWidths: [100, 190, 170, 220],
  columns: [
    {},
    {},
    {},
    // show two lines of the note and end the second one with an ellipsis
    { textEllipsis: 2 },
  ],
  width: '100%',
  height: 'auto',
  rowHeaders: true,
  autoRowSize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

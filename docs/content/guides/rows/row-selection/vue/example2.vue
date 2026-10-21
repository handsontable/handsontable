<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel'],
  ],
  height: 'auto',
  colHeaders: ['SKU', 'Product', 'Supplier', 'Category'],
  // no row numbers: the checkbox column is the only row header
  rowHeaders: false,
  // reach the header checkbox with the arrow keys, toggle it with Space
  navigableHeaders: true,
  rowSelection: true,
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

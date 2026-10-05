<script setup lang="ts">
// to import filtering as an individual module, see the 'Import the filtering module' section of this page
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin'],
    ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Minneapolis'],
    ['SKU-4412', 'Canvas Tote Bag', 'Nordic Traders', 'Apparel', 'Boston'],
  ],
  nestedHeaders: [
    [
      { label: 'Item', colspan: 2 },
      { label: 'Supply chain', colspan: 3 },
    ],
    ['SKU', 'Product name', 'Supplier', 'Category', 'Warehouse'],
  ],
  // enable filtering
  filters: true,
  // enable the column menu
  dropdownMenu: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="exampleFilterNestedHeaders">
    <HotTable :settings="hotSettings" />
  </div>
</template>

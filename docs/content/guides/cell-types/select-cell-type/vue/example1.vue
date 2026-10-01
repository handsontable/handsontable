<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware'],
    ['SKU-0093', 'Wireless Mouse', 'Electronics'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Furniture'],
    ['SKU-2208', 'USB-C Charging Cable', 'Electronics'],
    ['SKU-3341', 'Aluminum Water Filter', 'Drinkware'],
  ],
  colWidths: [90, 210, 110],
  colHeaders: ['SKU', 'Product', 'Category'],
  columns: [
    {},
    {},
    {
      type: 'select',
      selectOptions: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

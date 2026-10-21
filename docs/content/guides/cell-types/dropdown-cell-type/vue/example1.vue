<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  height: 'auto',
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Electronics', 'Austin'],
    ['SKU-3341', 'Aluminum Water Filter', 'Drinkware', 'Minneapolis'],
  ],
  colHeaders: ['SKU', 'Product', 'Category', 'Warehouse'],
  columns: [
    {},
    {},
    {
      type: 'dropdown',
      source: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
    },
    {
      type: 'dropdown',
      source: [
        'Seattle',
        'Denver',
        'Portland',
        'Austin',
        'Minneapolis',
        'Boston',
        'Chicago',
        'Phoenix',
        'Atlanta',
        'Dallas',
        'San Jose',
        'Columbus',
      ],
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

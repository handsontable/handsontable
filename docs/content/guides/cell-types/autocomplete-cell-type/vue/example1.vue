<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const warehouses = [
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
];
const products = [
  'Stainless Steel Water Bottle',
  'Wireless Mouse',
  'Ergonomic Office Chair',
  'USB-C Charging Cable',
  'Aluminum Water Filter',
  'Canvas Tote Bag',
  'USB-C Hub',
  'Ceramic Mug Set',
  'Desk Lamp',
  'Laptop Stand',
  'Bluetooth Speaker',
  'Standing Desk',
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
    ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
    ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
    ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
    ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
  ],
  colHeaders: ['Supplier', 'SKU', 'Warehouse', 'Product'],
  columns: [
    {
      type: 'autocomplete',
      source: [
        'Harbor Goods',
        'Alpine Supply Co.',
        'Cascade Distributors',
        'Summit Trading',
        'Northgate Wholesale',
        'Nordic Traders',
      ],
      strict: false,
    },
    {},
    {
      type: 'autocomplete',
      source: warehouses,
      strict: false,
      visibleRows: 4,
    },
    {
      type: 'autocomplete',
      source: products,
      strict: false,
      trimDropdown: false,
      width: 120,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

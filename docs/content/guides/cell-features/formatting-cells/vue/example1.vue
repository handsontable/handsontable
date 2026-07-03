<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Laptop Pro 15', 'Electronics', 149900, 42],
    ['SKU-0093', 'Wireless Mouse', 'Peripherals', 2999, 218],
    ['SKU-7712', 'USB-C Hub 7-port', 'Peripherals', 5499, 0],
    ['SKU-3305', 'Mech. Keyboard', 'Peripherals', 8999, 67],
    ['SKU-9140', '4K Monitor 27"', 'Electronics', 34999, 15],
  ],
  rowHeaders: true,
  colHeaders: ['SKU', 'Product', 'Category', 'Price ($)', 'Stock'],
  stretchH: 'all',
  className: 'custom-table',
  cell: [
    {
      row: 0,
      col: 0,
      className: 'custom-cell',
    },
  ],
  height: 'auto',
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

<style>
td.custom-cell {
  color: #fff !important;
  background-color: #254ac6 !important;
}
.custom-table thead th:nth-child(even),
.custom-table tbody tr:nth-child(odd) th {
  color: #fff !important;
  background-color: #254ac6 !important;
}
</style>

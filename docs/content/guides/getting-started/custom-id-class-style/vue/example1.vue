<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Wireless Mouse', 142, 'Electronics'],
    ['SKU-0093', 'USB-C Cable', 67, 'Electronics'],
    ['SKU-1175', 'Desk Lamp', 0, 'Home Office'],
    ['SKU-3340', 'Notebook', 230, 'Stationery'],
    ['SKU-7782', 'Standing Desk', 18, 'Furniture'],
  ],
  colHeaders: ['SKU', 'Product', 'Stock', 'Category'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
const id = ref('inventory-grid');
const className = ref('inventory-grid');
const style = ref('border: 1px solid #4caf50;');
</script>

<template>
  <div id="example1">
    <HotTable :id="id" :class="className" :style="style" :settings="hotSettings" />
  </div>
</template>

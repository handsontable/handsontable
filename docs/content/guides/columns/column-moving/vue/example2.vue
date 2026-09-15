<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors'],
  ],
  colHeaders: true,
  rowHeaders: true,
  manualColumnMove: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

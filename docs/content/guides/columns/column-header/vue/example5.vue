<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
  ],
  colHeaders: true,
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  headerClassName: 'htLeft',
  columns: [
    { headerClassName: 'italic-text' },
    { headerClassName: 'bold-text italic-text' },
    { headerClassName: 'htRight bold-text italic-text' },
    {},
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<style>
.bold-text {
  font-weight: bold;
}

.italic-text {
  font-style: italic;
}
</style>

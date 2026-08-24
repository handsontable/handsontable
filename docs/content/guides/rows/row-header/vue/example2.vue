<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    [42000, 31000, 11000],
    [45500, 33200, 12300],
    [48700, 35100, 13600],
    [51200, 36800, 14400],
    [54800, 38900, 15900],
    [57300, 40100, 17200],
  ],
  colHeaders: ['Revenue', 'Expenses', 'Profit'],
  rowHeaders: ['January', 'February', 'March', 'April', 'May', 'June'],
  rowHeaderWidth: 80,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

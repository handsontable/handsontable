<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const data = new Array(200) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(20) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const hotSettings = ref<GridSettings>({
  data,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  colWidths: 100,
  manualColumnMove: true,
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

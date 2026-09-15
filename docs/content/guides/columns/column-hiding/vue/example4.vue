<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const data = new Array(10) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(10) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  data,
  height: 200,
  colHeaders: true,
  rowHeaders: true,
  // enable the context menu
  contextMenu: true,
  // enable the `HiddenColumns` plugin
  // automatically adds the context menu's column hiding items
  hiddenColumns: {
    columns: [3, 5, 9],
    indicators: true,
  },
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

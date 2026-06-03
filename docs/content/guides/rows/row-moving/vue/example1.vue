<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

// generate an array of arrays with dummy data
const data: string[][] = new Array(200) // number of rows
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
  manualRowMove: true,
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

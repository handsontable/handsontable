<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

// generate an array of arrays with dummy data
const data: string[][] = new Array(1000) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(1000) // number of columns
      .fill(null)
      .map((_v, column) => `${row}, ${column}`)
  );

const hotSettings = ref<GridSettings>({
  data,
  colWidths: 100,
  width: '100%',
  height: 320,
  rowHeaders: true,
  colHeaders: true,
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

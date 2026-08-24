<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const data = new Array(50)
  .fill(null)
  .map((_, row) =>
    new Array(500)
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const hotSettings = ref<GridSettings>({
  data,
  height: 320,
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  mergeCells: {
    virtualized: true,
    cells: [{ row: 1, col: 1, rowspan: 3, colspan: 498 }],
  },
  viewportColumnRenderingOffset: 15,
  viewportColumnRenderingThreshold: 5,
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

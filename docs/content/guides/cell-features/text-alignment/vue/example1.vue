<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const data = new Array(100)
  .fill(null)
  .map((_, row) =>
    new Array(18)
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const hotSettings = ref<GridSettings>({
  data,
  colWidths: 100,
  height: 320,
  rowHeaders: true,
  colHeaders: true,
  contextMenu: true,
  licenseKey: 'non-commercial-and-evaluation',
  mergeCells: [
    { row: 1, col: 1, rowspan: 3, colspan: 3 },
    { row: 3, col: 4, rowspan: 2, colspan: 2 },
  ],
  className: 'htCenter',
  cell: [
    { row: 0, col: 0, className: 'htRight' },
    { row: 1, col: 1, className: 'htLeft htMiddle' },
    { row: 3, col: 4, className: 'htLeft htBottom' },
  ],
  afterSetCellMeta(row, col, key, val) {
    console.log('cell meta changed', row, col, key, val);
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

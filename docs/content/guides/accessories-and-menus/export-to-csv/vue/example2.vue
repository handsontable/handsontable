<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const gridData = [
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
  ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
  ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4'],
  ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5'],
  ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6'],
  ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'],
];

const hotSettings = ref<GridSettings>({
  data: gridData,
  colHeaders: true,
  rowHeaders: true,
  hiddenRows: { rows: [1, 3, 5], indicators: true },
  hiddenColumns: { columns: [1, 3, 5], indicators: true },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function exportBlob(): void {
  const exportPlugin = hotRef.value?.hotInstance?.getPlugin('exportFile');
  const exportedBlob = exportPlugin?.exportAsBlob('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    rowHeaders: true,
  });

  console.log(exportedBlob);
}
</script>

<template>
  <div id="example2">
    <div class="example-controls-container">
      <div class="controls">
        <button id="export-blob" type="button" @click="exportBlob">
          Export as a Blob
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

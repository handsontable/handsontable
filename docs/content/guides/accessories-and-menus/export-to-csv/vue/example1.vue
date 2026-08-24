<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const gridData = [
  ['Spring Launch', 'Email', 'North America', '1240', '4.2%', '$12000', 'Q1 2025'],
  ['Partner Webinar', 'Paid Search', 'EMEA', '860', '6.1%', '$9400', 'Q1 2025'],
  ['Summer Upsell', 'Social', 'APAC', '1520', '3.7%', '$13800', 'Q2 2025'],
  ['Product Video', 'Email', 'North America', '980', '5.4%', '$8600', 'Q2 2025'],
  ['Back-to-School', 'Display', 'LATAM', '1110', '4.8%', '$10100', 'Q3 2025'],
  ['Holiday Teaser', 'Affiliate', 'EMEA', '1340', '5.9%', '$12700', 'Q4 2025'],
  ['Loyalty Drive', 'SMS', 'APAC', '790', '7.3%', '$6200', 'Q4 2025'],
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

function downloadCsv(): void {
  const exportPlugin = hotRef.value?.hotInstance?.getPlugin('exportFile');

  exportPlugin?.downloadFile('csv', {
    bom: false,
    columnDelimiter: ',',
    colHeaders: false,
    exportHiddenColumns: true,
    exportHiddenRows: true,
    fileExtension: 'csv',
    filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
    mimeType: 'text/csv',
    rowDelimiter: '\r\n',
    rowHeaders: true,
  });
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button id="export-file" type="button" @click="downloadCsv">
          Download CSV
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

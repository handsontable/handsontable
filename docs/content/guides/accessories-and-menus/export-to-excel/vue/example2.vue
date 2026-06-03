<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotQ1Ref = ref<InstanceType<typeof HotTable> | null>(null);
const hotQ2Ref = ref<InstanceType<typeof HotTable> | null>(null);

const q1Data = [
  ['Alice Martin', 'North', 142000, true],
  ['Bob Chen', 'East', 98500, true],
  ['Carol Davies', 'South', 76200, false],
  ['David Kim', 'West', 115300, true],
  ['Eva Rossi', 'North', 54800, false],
];

const q2Data = [
  ['Alice Martin', 'North', 158000, true],
  ['Bob Chen', 'East', 112400, true],
  ['Carol Davies', 'South', 89100, true],
  ['David Kim', 'West', 97600, false],
  ['Eva Rossi', 'North', 63200, true],
];

const sharedSettings: GridSettings = {
  columns: [
    { type: 'text' },
    { type: 'dropdown', source: ['North', 'South', 'East', 'West'] },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    },
    { type: 'checkbox' },
  ],
  colHeaders: ['Name', 'Region', 'Revenue ($)', 'Hit Target?'],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  exportFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
};

const hotQ1Settings = ref<GridSettings>({ ...sharedSettings, data: q1Data });
const hotQ2Settings = ref<GridSettings>({ ...sharedSettings, data: q2Data });

async function exportSheets(): Promise<void> {
  const hotQ1 = hotQ1Ref.value?.hotInstance;
  const hotQ2 = hotQ2Ref.value?.hotInstance;
  const exportPlugin = hotQ1?.getPlugin('exportFile');

  if (!hotQ1 || !hotQ2 || !exportPlugin) {
    return;
  }

  await exportPlugin.downloadFileAsync('xlsx', {
    filename: 'Annual-Sales-Report',
    sheets: [
      { instance: hotQ1, name: 'Q1 Sales', colHeaders: true, rowHeaders: true },
      { instance: hotQ2, name: 'Q2 Sales', colHeaders: true, rowHeaders: true },
    ],
  });
}
</script>

<template>
  <div id="example2">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" @click="exportSheets">
          Export XLSX
        </button>
      </div>
    </div>
    <p><strong>Q1 Sales</strong></p>
    <HotTable ref="hotQ1Ref" :settings="hotQ1Settings" />
    <p><strong>Q2 Sales</strong></p>
    <HotTable ref="hotQ2Ref" :settings="hotQ2Settings" />
  </div>
</template>

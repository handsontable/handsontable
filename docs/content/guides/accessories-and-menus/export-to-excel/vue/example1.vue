<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotData = [
  ['Alice Martin', 'North', 142000, true, 'Exceeded Q1 target by 18%.'],
  ['Bob Chen', 'East', 98500, true, 'Strong pipeline for Q2.'],
  ['Carol Davies', 'South', 76200, false, 'Needs coaching on closing.'],
  ['David Kim', 'West', 115300, true, 'Cross-sell opportunity.'],
  ['Eva Rossi', 'North', 54800, false, 'Sick leave impacted March.'],
  ['TOTALS', '', null, '', ''],
];

const hotSettings = ref<GridSettings>({
  data: hotData,
  nestedHeaders: [
    [
      { label: 'Sales Representative', colspan: 2, headerClassName: 'htCenter' },
      { label: 'Results', colspan: 2, headerClassName: 'htCenter' },
      { label: 'Notes', colspan: 1, headerClassName: 'htLeft' },
    ],
    ['Name', 'Region', 'Revenue ($)', 'Hit Target?', 'Notes'],
  ],
  columns: [
    { type: 'text' },
    { type: 'dropdown', source: ['North', 'South', 'East', 'West'] },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    },
    { type: 'checkbox' },
    { type: 'text' },
  ],
  columnSummary: [
    {
      sourceColumn: 2,
      destinationRow: 5,
      destinationColumn: 2,
      type: 'sum',
      forceNumeric: true,
    },
  ],
  mergeCells: [{ row: 5, col: 0, rowspan: 1, colspan: 2 }],
  customBorders: [{ row: 5, col: 2, top: { width: 2, color: '#333333' } }],
  cell: [
    { row: 5, col: 0, readOnly: true },
    { row: 5, col: 2, readOnly: true },
  ],
  fixedColumnsStart: 1,
  rowHeaders: true,
  colHeaders: false,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  exportFile: { engines: { xlsx: ExcelJS } },
  afterInit() {
    this.setCellMeta(0, 4, 'comment', { value: 'Top sales rep — review for promotion.' });
    this.render();
  },
  licenseKey: 'non-commercial-and-evaluation',
});

async function exportFile(): Promise<void> {
  const exportPlugin = hotRef.value?.hotInstance?.getPlugin('exportFile');

  await exportPlugin?.downloadFileAsync('xlsx', {
    filename: 'Q1-Sales-Report',
    colHeaders: true,
    rowHeaders: true,
    exportFormulas: true,
  });
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" @click="exportFile">
          Export XLSX
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

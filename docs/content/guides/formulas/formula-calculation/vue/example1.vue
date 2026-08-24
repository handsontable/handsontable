<script setup lang="ts">
import { ref, markRaw } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const data1 = [
  ['10.26', null, 'Sum', '=SUM(A:A)'],
  ['20.12', null, 'Average', '=AVERAGE(A:A)'],
  ['30.01', null, 'Median', '=MEDIAN(A:A)'],
  ['40.29', null, 'MAX', '=MAX(A:A)'],
  ['50.18', null, 'MIN', '=MIN(A1:A5)'],
];

const data2 = [
  ['Is A1 in Sheet1 > 10?', '=IF(Sheet1!A1>10,"TRUE","FALSE")'],
  ['Is A:A in Sheet > 150?', '=IF(SUM(Sheet1!A:A)>150,"TRUE","FALSE")'],
  ['How many blank cells are in the Sheet1?', '=COUNTBLANK(Sheet1!A1:D5)'],
  ['Generate a random number', '=RAND()'],
  ['Number of sheets in this workbook', '=SHEETS()'],
];

// create an external HyperFormula instance, initialized with the
// `'internal-use-in-handsontable'` license key, and shared by both grids.
// `markRaw` prevents Vue from wrapping the instance in a reactive proxy.
const hyperformulaInstance = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  })
);

const sheet1Settings = ref<GridSettings>({
  data: data1,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet1',
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const sheet2Settings = ref<GridSettings>({
  data: data2,
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  formulas: {
    engine: hyperformulaInstance,
    sheetName: 'Sheet2',
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <h3 class="demo-preview">Sheet 1</h3>
    <HotTable :settings="sheet1Settings" />
    <h3 class="demo-preview">Sheet 2</h3>
    <HotTable :settings="sheet2Settings" />
  </div>
</template>

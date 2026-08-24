<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const output = ref('');

const logEvent = (message: string) => {
  output.value = `${message}\n${output.value}`;
};

const hotSettings: GridSettings = {
  data: [
    ['North America', 420000, 465000, 501000],
    ['Europe', 388000, 402000, 411000],
    ['APAC', 275000, 298000, 312000],
    ['Latin America', 142000, 151000, 158000],
    ['Middle East', 96000, 101000, 108000],
  ],
  colHeaders: ['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
  rowHeaders: true,
  height: 'auto',
  contextMenu: true,
  mergeCells: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  beforeMergeCells: (cellRange) => {
    logEvent(`beforeMergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
  },
  afterMergeCells: (cellRange, mergeParent) => {
    logEvent(`afterMergeCells: merged into ${mergeParent.rowspan} row(s) by ${mergeParent.colspan} column(s).`);
  },
  beforeUnmergeCells: (cellRange) => {
    logEvent(`beforeUnmergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
  },
  afterUnmergeCells: (cellRange) => {
    logEvent(`afterUnmergeCells: rows ${cellRange.from.row}-${cellRange.to.row}, columns ${cellRange.from.col}-${cellRange.to.col}.`);
  },
};
</script>

<template>
  <div id="example3">
    <output class="console" id="example3-output">{{
      output ||
        'Select cells, then press Ctrl+M (or use the context menu) to merge or unmerge them. Hook activity appears here.'
    }}</output>
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    [42000, 45500, 48700, 51200],
    [18300, 19100, 20400, 21600],
    [23700, 26400, 28300, 29600],
    [9800, 10200, 11100, 11700],
    [13900, 16200, 17200, 17900],
    [11200, 13100, 13900, 14500],
  ],
  colHeaders: ['Q1', 'Q2', 'Q3', 'Q4'],
  rowHeaders: [
    'Revenue',
    'Cost of goods sold',
    'Gross profit',
    'Operating expenses',
    'Operating income',
    'Net income',
  ],
  // Size the row header column to its longest label.
  autoRowHeaderSize: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

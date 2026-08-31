<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const groups = ['Top line', 'Direct costs', 'Margin', 'Overhead', 'Margin', 'Bottom line'];
const lineItems = [
  'Revenue',
  'Cost of goods sold',
  'Gross profit',
  'Operating expenses',
  'Operating income',
  'Net income',
];

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
  rowHeaders: true,
  // Add two more row header columns next to the numbering.
  afterGetRowHeaderRenderers: (renderers: Array<(renderableRowIndex: number, TH: HTMLElement) => void>) => {
    // A renderer gets the renderable row index. It matches the visual index when no rows are hidden.
    renderers.push((renderableRowIndex, TH) => {
      TH.innerText = groups[renderableRowIndex];
    });
    renderers.push((renderableRowIndex, TH) => {
      TH.innerText = lineItems[renderableRowIndex];
    });
  },
  // Measure each of the three row header columns on its own.
  autoRowHeaderSize: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const output = ref('Drag the fill handle to see the affected range logged here.');

const data: GridSettings['data'] = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', ''],
];

const hotSettings: GridSettings = {
  data,
  rowHeaders: true,
  colHeaders: true,
  fillHandle: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  beforeAutofill(selectionData) {
    // This dealership reports sales in batches of 5 cars, so round every
    // filled value up to the nearest multiple of 5.
    return selectionData.map((row) =>
      row.map((value) => (typeof value === 'number' ? Math.ceil(value / 5) * 5 : value))
    );
  },
  afterAutofill(fillData, sourceRange, targetRange, direction) {
    output.value =
      `Filled rows ${targetRange.from.row}-${targetRange.to.row}, ` +
      `columns ${targetRange.from.col}-${targetRange.to.col} (direction: "${direction}").`;
  },
};
</script>

<template>
  <div id="example3">
    <output class="console" id="output">{{ output }}</output>
    <HotTable :settings="hotSettings" />
  </div>
</template>

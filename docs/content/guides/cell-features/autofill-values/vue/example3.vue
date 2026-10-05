<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const output = ref('Drag the fill handle to see the affected range logged here.');

const data: GridSettings['data'] = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', '', '', '', ''],
  ['Boron', '', '', '', ''],
];

const hotSettings: GridSettings = {
  data,
  rowHeaders: true,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
  colWidths: [80, 62, 110, 118, 110],
  stretchH: 'all',
  fillHandle: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  beforeAutofill(selectionData) {
    // Round every filled number up to the nearest multiple of 5.
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

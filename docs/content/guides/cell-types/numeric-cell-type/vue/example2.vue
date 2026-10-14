<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const readout = ref('Edit a cell in the Default or preserveNumericLiteral column to see the stored value.');

const hotData = [
  ['Stainless Steel Water Bottle', 24.5, 24.5],
  ['Wireless Mouse', 18, 18],
  ['USB-C Charging Cable', 9.9, 9.9],
  ['Desk Lamp', 32, 32],
  ['Notebook A5', 4.75, 4.75],
];

// A plain object, so updating the readout does not trigger `updateSettings()`.
const hotSettings: GridSettings = {
  colHeaders: ['Product', 'Default', 'preserveNumericLiteral: true'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  afterChange(changes, source) {
    if (source === 'loadData' || !changes) {
      return;
    }

    const [row, prop] = changes[changes.length - 1];
    const column = prop as number;
    const value = this.getDataAtCell(row, column);
    const label = column === 1 ? 'Default' : 'preserveNumericLiteral';

    readout.value = `${label} stores: ${JSON.stringify(value)} (${typeof value})`;
  },
  licenseKey: 'non-commercial-and-evaluation',
};
</script>

<template>
  <div id="example2">
    <HotTable :data="hotData" :settings="hotSettings">
      <HotColumn type="text" :readOnly="true" :width="240" />
      <HotColumn type="numeric" />
      <HotColumn type="numeric" :preserveNumericLiteral="true" />
    </HotTable>
    <p id="example2-readout" aria-live="polite">{{ readout }}</p>
  </div>
</template>

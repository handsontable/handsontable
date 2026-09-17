<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Hydrogen', 'H', 1, 1.008, 7, -434.4, -423.2],
    ['Helium', 'He', 2, 4.003, 9, -458.0, -452.1],
    ['Lithium', 'Li', 3, 6.94, 9, 356.9, 2447.6],
    ['Beryllium', 'Be', 4, 9.012, 11, 2348.6, 4478.8],
    ['Boron', 'B', 5, 10.81, 11, 3768.8, 7100.6],
  ],
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes', 'Melting Point (°F)', 'Boiling Point (°F)'],
  columns: [
    {},
    {},
    { type: 'numeric', numericFormat: { pattern: '0' } },
    { type: 'numeric', numericFormat: { pattern: '0.0' } },
    { type: 'numeric', numericFormat: { pattern: '0' } },
    { type: 'numeric', numericFormat: { pattern: '0.0' } },
    { type: 'numeric', numericFormat: { pattern: '0.0' } },
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

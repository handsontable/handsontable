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
  // Set each column header label with the `title` option inside `columns`.
  columns: [
    { title: 'Name' },
    { title: 'Symbol' },
    { title: 'Atomic Number', type: 'numeric', numericFormat: { maximumFractionDigits: 0, useGrouping: false } },
    { title: 'Atomic Mass (u)', type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
    { title: 'Known Isotopes', type: 'numeric', numericFormat: { maximumFractionDigits: 0, useGrouping: false } },
    { title: 'Melting Point (°F)', type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
    { title: 'Boiling Point (°F)', type: 'numeric', numericFormat: { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false } },
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example6">
    <HotTable :settings="hotSettings" />
  </div>
</template>

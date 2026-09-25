<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['H', 1, 'Hydrogen', 'Nonmetal', 1.008, -434.4, -423.2, 0.00009, 2.2, 25],
    ['He', 2, 'Helium', 'Noble gas', 4.003, -458.0, -452.1, 0.00018, undefined, undefined],
    ['Li', 3, 'Lithium', 'Alkali metal', 6.94, 356.9, 2447.6, 0.534, 0.98, 145],
    ['Be', 4, 'Beryllium', 'Alkaline earth metal', 9.012, 2348.6, 4478.8, 1.85, 1.57, 105],
    ['B', 5, 'Boron', 'Metalloid', 10.81, 3768.8, 7100.6, 2.34, 2.04, 85],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: [
    'Symbol',
    'Atomic Number',
    'Name',
    'Category',
    'Atomic Mass',
    'Melting Point (°F)',
    'Boiling Point (°F)',
    'Density (g/cm³)',
    'Electronegativity',
    'Atomic Radius (pm)',
  ],
  rowHeaders: true,
  colWidths: [70, 120, 90, 160, 110, 140, 140, 130, 140, 150],
  manualColumnResize: true,
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

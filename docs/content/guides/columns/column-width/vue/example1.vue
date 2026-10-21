<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['H', 'Hydrogen', 1, 1.008, -434.4, 0.00009, 'Gas'],
    ['He', 'Helium', 2, 4.003, -458.0, 0.00018, 'Gas'],
    ['Li', 'Lithium', 3, 6.94, 356.9, 0.534, 'Solid'],
    ['Be', 'Beryllium', 4, 9.012, 2348.6, 1.85, 'Solid'],
    ['B', 'Boron', 5, 10.81, 3768.8, 2.34, 'Solid'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Symbol', 'Name', 'Atomic Number', 'Atomic Mass', 'Melting Point (°F)', 'Density (g/cm³)', 'State'],
  rowHeaders: true,
  colWidths: 100,
  manualColumnResize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

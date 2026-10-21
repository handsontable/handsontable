<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Hydrogen', 'H', 1, -434.4, 'Gas'],
    ['Helium', 'He', 2, -458.0, 'Gas'],
    ['Lithium', 'Li', 3, 356.9, 'Solid'],
    ['Beryllium', 'Be', 4, 2348.6, 'Solid'],
    ['Boron', 'B', 5, 3768.8, 'Solid'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Melting Point (°F)', 'State'],
  rowHeaders: true,
  colWidths: [200, 100, 100, 150, 100],
  manualColumnResize: true,
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

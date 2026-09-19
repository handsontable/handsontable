<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['H', 1, -434.4, 0.00009, 'Nonmetal'],
    ['He', 2, -458.0, 0.00018, 'Noble gas'],
    ['Li', 3, 356.9, 0.534, 'Alkali metal'],
    ['Be', 4, 2348.6, 1.85, 'Alkaline earth'],
    ['B', 5, 3768.8, 2.34, 'Metalloid'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Symbol', 'Atomic Number', 'Melting Point (°F)', 'Density (g/cm³)', 'Group'],
  rowHeaders: true,
  colWidths(index) {
    return (index + 1) * 40;
  },
  manualColumnResize: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>

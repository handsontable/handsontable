<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings: GridSettings = {
  data: [
    { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
    { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
    { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
    { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
    { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
  ],
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  cells(row) {
    return row === 1 ? { readOnly: true } : {};
  },
};
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

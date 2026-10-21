<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type ElementRow = {
  name: string;
  symbol: string;
  atomicNumber: number;
  atomicMass: number;
};

const data: ElementRow[] = [
  { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
  { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
  { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
  { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
  { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
];

const hotSettings: GridSettings = {
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  cells(row, _col, prop) {
    const propName = prop as keyof ElementRow;

    if (data[row]?.[propName] === 'Helium') {
      return { editor: false };
    }

    return { editor: 'text' };
  },
};
</script>

<template>
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

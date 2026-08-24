<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type CarRow = {
  car: string;
  year: number;
  chassis: string;
  bumper: string;
};

const data: CarRow[] = [
  { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
  { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
  { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
  { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
];

const columnKeys: (keyof CarRow)[] = ['car', 'year', 'chassis', 'bumper'];

const hotSettings: GridSettings = {
  data,
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  cells(row, col) {
    const key = columnKeys[col];

    if (key !== undefined && data[row]?.[key] === 'Nissan') {
      return { readOnly: true };
    }

    return {};
  },
};
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

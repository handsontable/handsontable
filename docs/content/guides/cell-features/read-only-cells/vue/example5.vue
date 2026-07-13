<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings: GridSettings = {
  data: [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
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

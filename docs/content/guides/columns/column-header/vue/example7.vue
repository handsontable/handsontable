<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    [1, 'Ana Garcia', 'Product Manager', 'Spain', '2022-03-14'],
    [2, 'James Okafor', 'Senior Engineer', 'Nigeria', '2021-07-02'],
    [3, 'Li Wei', 'Data Analyst', 'China', '2023-01-19'],
    [4, 'Sofia Rossi', 'UX Designer', 'Italy', '2020-11-30'],
    [5, 'Mateo Fernandez', 'Engineering Lead', 'Argentina', '2019-05-08'],
  ],
  colHeaders: ['Employee ID', 'Employee full name', 'Current job title', 'Country of residence', 'Employment start date'],
  rowHeaders: true,
  colWidths: [100, 130, 130, 130, 130],
  columnHeaderHeight: 50,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example7">
    <HotTable :settings="hotSettings" />
  </div>
</template>

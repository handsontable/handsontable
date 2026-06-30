<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    [1, 'Ana García', 'Product Manager', 'Spain', '2022-03-14'],
    [2, 'James Okafor', 'Senior Engineer', 'Nigeria', '2021-07-02'],
    [3, 'Li Wei', 'Data Analyst', 'China', '2023-01-19'],
    [4, 'Sofia Rossi', 'UX Designer', 'Italy', '2020-11-30'],
    [5, 'Mateo Fernández', 'Engineering Lead', 'Argentina', '2019-05-08'],
  ],
  // Set each column header label with the `title` option inside `columns`.
  columns: [
    { title: 'ID' },
    { title: 'Full name' },
    { title: 'Position' },
    { title: 'Country' },
    { title: 'Start date' },
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

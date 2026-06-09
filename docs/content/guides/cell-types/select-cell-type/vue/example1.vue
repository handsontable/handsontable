<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['2017', 'Honda', 10],
    ['2018', 'Toyota', 20],
    ['2019', 'Nissan', 30],
  ],
  colWidths: [50, 70, 50],
  colHeaders: true,
  columns: [
    {},
    {
      type: 'select',
      selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda'],
    },
    {},
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

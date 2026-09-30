<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', 'Be', 4, 9.012, 11],
  ['Boron', 'B', 5, 10.81, 15],
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
  minSpareRows: 1,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

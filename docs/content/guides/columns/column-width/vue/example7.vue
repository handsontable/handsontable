<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['H', 'Nonmetal', 1],
    ['He', 'Noble gas', 2],
    ['Li', 'Alkali metal', 3],
    ['Be', 'Alkaline earth', 4],
    ['B', 'Metalloid', 5],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Symbol', 'Group', 'Atomic Number'],
  rowHeaders: true,
  columns: [
    { width: 90 },
    {},
    { width: 60 },
  ],
  modifyColWidth(width, column) {
    if (column === 1 && width > 150) {
      return 100;
    }
  },
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

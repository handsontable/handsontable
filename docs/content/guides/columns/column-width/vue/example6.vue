<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['H', 'Hydrogen', 1, 'Gas'],
    ['He', 'Helium', 2, 'Gas'],
    ['Li', 'Lithium', 3, 'Solid'],
    ['Be', 'Beryllium', 4, 'Solid'],
    ['B', 'Boron', 5, 'Solid'],
  ],
  width: '100%',
  height: 'auto',
  colWidths: 80,
  colHeaders: ['Symbol', 'Name', 'Atomic Number', 'State'],
  rowHeaders: true,
  stretchH: 'last',
  contextMenu: true,
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

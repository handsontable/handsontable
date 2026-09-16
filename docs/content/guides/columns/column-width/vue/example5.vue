<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['H', 'Hydrogen', 'Nonmetal'],
    ['He', 'Helium', 'Noble gas'],
    ['Li', 'Lithium', 'Alkali metal'],
    ['Be', 'Beryllium', 'Alkaline earth'],
    ['B', 'Boron', 'Metalloid'],
  ],
  width: '100%',
  height: 'auto',
  colHeaders: ['Symbol', 'Name', 'Group'],
  rowHeaders: true,
  stretchH: 'all',
  contextMenu: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

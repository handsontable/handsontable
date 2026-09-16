<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Hydrogen', 'H', 1],
    ['Helium', 'He', 2],
    ['Lithium', 'Li', 3],
    ['Beryllium', 'Be', 4],
    ['Boron', 'B', 5],
  ],
  colHeaders: ['Name', 'Symbol', 'Atomic Number'],
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'all',
  headerClassName: 'htCenter',
  columns: [
    { headerClassName: 'htRight' },
    { headerClassName: 'htLeft' },
    { type: 'numeric', numericFormat: { pattern: '0' } },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

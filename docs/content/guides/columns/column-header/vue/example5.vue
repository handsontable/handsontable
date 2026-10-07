<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Hydrogen', 'H', 1, 1.008],
    ['Helium', 'He', 2, 4.003],
    ['Lithium', 'Li', 3, 6.94],
    ['Beryllium', 'Be', 4, 9.012],
    ['Boron', 'B', 5, 10.81],
  ],
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)'],
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'all',
  headerClassName: 'htLeft',
  columns: [
    { headerClassName: 'italic-text' },
    { headerClassName: 'bold-text italic-text' },
    { headerClassName: 'htRight bold-text italic-text', type: 'numeric' },
    { type: 'numeric', numericFormat: { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: false } },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<style>
.bold-text {
  font-weight: bold;
}

.italic-text {
  font-style: italic;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  data: [[0.5, 0.5], [0.5, 0.5], [1, 1], [], []],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'average',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
    },
    {
      type: 'average',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // round this column summary result to two digits after the decimal point
      roundFloat: 2,
    },
  ],
  height: 'auto',
});
</script>

<template>
  <div id="example12">
    <HotTable :settings="hotSettings" />
  </div>
</template>

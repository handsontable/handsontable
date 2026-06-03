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
  data: [[0, 1, 2], ['3c', '4b', 5], [], []],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true,
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
      // force this column summary to treat non-numeric values as numeric values
      forceNumeric: true,
    },
  ],
  height: 'auto',
});
</script>

<template>
  <div id="example10">
    <HotTable :settings="hotSettings" />
  </div>
</template>

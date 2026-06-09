<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['A1', 'B1'],
    ['A2', 'B2'],
    ['A3', 'B3'],
    ['A4', 'B4'],
    ['A5', 'B5'],
    ['A6', 'B6'],
    ['A7', 'B7'],
    ['A8', 'B8'],
    ['A9', 'B9'],
    ['A10', 'B10'],
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
const secondColumnSettings = ref<GridSettings>({
  title: 'Second column header',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings">
      <HotColumn title="First column header" />
      <HotColumn :settings="secondColumnSettings" read-only="true" />
    </HotTable>
  </div>
</template>

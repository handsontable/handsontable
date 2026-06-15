<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
    { id: 2, address: '' },
    { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
  ],
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns(column) {
    let columnMeta = {};

    if (column === 0) {
      columnMeta.data = 'id';
    } else if (column === 1) {
      columnMeta.data = 'name.first';
    } else if (column === 2) {
      columnMeta.data = 'name.last';
    } else if (column === 3) {
      columnMeta.data = 'address';
    } else {
      columnMeta = {};
    }

    return columnMeta;
  },
  minSpareRows: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

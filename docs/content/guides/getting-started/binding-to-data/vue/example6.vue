<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [],
  dataSchema: {
    id: null,
    name: {
      first: null,
      last: null,
    },
    address: null,
  },
  startRows: 5,
  startCols: 4,
  colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
  height: 'auto',
  width: 'auto',
  columns: [{ data: 'id' }, { data: 'name.first' }, { data: 'name.last' }, { data: 'address' }],
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
</script>

<template>
  <div id="example6">
    <HotTable :settings="hotSettings" />
  </div>
</template>

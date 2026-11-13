<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [],
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  emptyDataState: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

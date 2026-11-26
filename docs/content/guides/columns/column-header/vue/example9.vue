<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const output = ref('Rename a header to see the change here.');

const hotSettings = ref<GridSettings>({
  data: [
    ['Wireless mouse', 'Accessories', 24.9, 120],
    ['Mechanical keyboard', 'Accessories', 89, 45],
    ['27-inch monitor', 'Displays', 319.5, 18],
    ['USB-C dock', 'Accessories', 149, 32],
  ],
  colHeaders: ['Product', 'Category', 'Price', 'In stock'],
  rowHeaders: true,
  navigableHeaders: true,
  contextMenu: true,
  editableHeaders: { columnHeaders: true, rowHeaders: true },
  // Save the new names in your app here.
  afterHeaderChange(axis, visualIndex, newValue, oldValue) {
    output.value = `Renamed the ${axis} header at index ${visualIndex} from "${oldValue}" to "${newValue}".`;
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
</script>

<template>
  <div id="example9">
    <HotTable :settings="hotSettings" />
    <output class="console" id="output">{{ output }}</output>
  </div>
</template>

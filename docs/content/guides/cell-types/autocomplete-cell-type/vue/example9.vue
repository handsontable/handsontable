<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const stockStatuses: string[] = [
  '<span style="color: light-dark(#1a7f37, #4ade80)">In stock</span>',
  '<span style="color: light-dark(#b35900, #fbbf24)">Low stock</span>',
  '<span style="color: light-dark(#c92a2a, #f87171)">Out of stock</span>',
  '<span style="color: light-dark(#495057, #adb5bd)">Backordered</span>',
  '<span style="color: light-dark(#495057, #adb5bd)">Discontinued</span>',
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    [stockStatuses[0], stockStatuses[0]],
    [stockStatuses[1], stockStatuses[1]],
    [stockStatuses[2], stockStatuses[2]],
    [stockStatuses[3], stockStatuses[3]],
    [stockStatuses[4], stockStatuses[4]],
  ],
  colHeaders: ['allowHtml: false (default)', 'allowHtml: true'],
  columns: [
    {
      type: 'autocomplete',
      source: stockStatuses,
      strict: false,
      // allowHtml: false is the default — HTML tags in `source` are shown as plain text
    },
    {
      type: 'autocomplete',
      source: stockStatuses,
      strict: false,
      // render `source` values as HTML — only use with trusted, static data
      allowHtml: true,
    },
  ],
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
</script>

<template>
  <div id="example9">
    <HotTable :settings="hotSettings" />
  </div>
</template>

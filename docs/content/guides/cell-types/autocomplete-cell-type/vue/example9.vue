<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const stockStatuses: string[] = [
  '<span style="color: #1a7f37">In stock</span>',
  '<span style="color: #b35900">Low stock</span>',
  '<span style="color: #c92a2a">Out of stock</span>',
  '<span style="color: #495057">Backordered</span>',
  '<span style="color: #495057">Discontinued</span>',
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
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example9">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const statuses: string[] = [
  'Backlog',
  'In progress',
  'Blocked',
  'Done',
  'Cancelled',
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    ['Backlog', 'Backlog'],
    ['In progress', 'In progress'],
    ['Blocked', 'Blocked'],
    ['Done', 'Done'],
    ['Cancelled', 'Cancelled'],
  ],
  colHeaders: ['Source order (default)', 'Alphabetical order'],
  columns: [
    {
      type: 'autocomplete',
      source: statuses,
      strict: false,
      // sortByRelevance: true is the default — suggestions keep the order from `source`
    },
    {
      type: 'autocomplete',
      source: statuses,
      strict: false,
      // sort suggestions alphabetically instead of using the `source` order
      sortByRelevance: false,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example8">
    <HotTable :settings="hotSettings" />
  </div>
</template>

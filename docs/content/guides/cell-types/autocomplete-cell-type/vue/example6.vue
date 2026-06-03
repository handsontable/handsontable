<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const fruits: string[] = [
  'Apple',
  'Apricot',
  'Avocado',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Lemon',
  'Lime',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Raspberry',
  'Strawberry',
  'Watermelon',
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    ['Apple', 'Apple'],
    ['Banana', 'Banana'],
    ['Cherry', 'Cherry'],
    ['Mango', 'Mango'],
    ['Orange', 'Orange'],
  ],
  colHeaders: ['Filter: true (default)', 'Filter: false'],
  columns: [
    {
      type: 'autocomplete',
      source: fruits,
      strict: false,
      // filter: true is the default — only matching options are shown
    },
    {
      type: 'autocomplete',
      source: fruits,
      strict: false,
      // don't hide options that don't match the search query
      filter: false,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example6">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const colors: string[] = [
  'Black',
  'Blue',
  'brown',
  'cyan',
  'Gray',
  'green',
  'Lime',
  'Magenta',
  'Navy',
  'olive',
  'orange',
  'Pink',
  'Purple',
  'Red',
  'silver',
  'Teal',
  'White',
  'Yellow',
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    ['Black', 'Black'],
    ['Blue', 'Blue'],
    ['Gray', 'Gray'],
    ['Red', 'Red'],
    ['White', 'White'],
  ],
  colHeaders: ['Case-insensitive (default)', 'Case-sensitive'],
  columns: [
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      // filteringCaseSensitive: false is the default — typing "bl" matches "Black" and "blue"
    },
    {
      type: 'autocomplete',
      source: colors,
      strict: false,
      // match case while searching autocomplete options
      filteringCaseSensitive: true,
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example7">
    <HotTable :settings="hotSettings" />
  </div>
</template>

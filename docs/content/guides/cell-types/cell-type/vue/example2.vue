<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['empty string', '', '', '', '', ''],
    ['null', null, null, null, null, null],
    ['undefined', undefined, undefined, undefined, undefined, undefined],
    ['non-empty value', 'non-empty text', 13000, true, 'orange', 'password'],
  ],
  columnSorting: {
    sortEmptyCells: true,
  },
  columns: [
    {
      columnSorting: {
        indicator: false,
        headerAction: false,
        compareFunctionFactory: function compareFunctionFactory() {
          return function comparator() {
            return 0; // Don't sort the first visual column.
          };
        },
      },
      readOnly: true,
    },
    {},
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      },
    },
    { type: 'checkbox' },
    { type: 'dropdown', source: ['yellow', 'red', 'orange'] },
    { type: 'password' },
  ],
  preventOverflow: 'horizontal',
  colHeaders: [
    'value<br>underneath',
    'type:text',
    'type:numeric',
    'type:checkbox',
    'type:dropdown',
    'type:password',
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

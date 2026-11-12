<template>
  <hot-table :settings="settings" />
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import type { GridSettings } from 'handsontable/settings';

const settings: GridSettings = {
  data: [],
  colHeaders: true,
  columns: [
    {
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. The correctFormat option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. The datePickerConfig option was removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
      type: 'date'
    },
    {
      type: 'numeric',
      locale: 'de-DE',

      numericFormat: {
        pattern: '0,0.00'
      }
    },
  ],
};
</script>

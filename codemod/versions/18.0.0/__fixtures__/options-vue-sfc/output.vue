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
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): Deleted correctFormat here. Use valueParser or valueSetter to correct entered values. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#correctformat-option
      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): Deleted datePickerConfig here. Check the native date input, which replaces Pikaday. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#datepickerconfig-option
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

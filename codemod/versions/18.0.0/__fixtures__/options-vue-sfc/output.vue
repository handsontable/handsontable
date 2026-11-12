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
      // TODO(handsontable-codemod 18.0.0/correct-format-removed): The correctFormat option was removed in 18.0 and was deleted here. The date, time, intl-date, and intl-time cell types work with ISO 8601 values and do not reformat input. To normalize or correct entered values, use the valueParser or valueSetter option.
      // TODO(handsontable-codemod 18.0.0/date-picker-config-removed): The datePickerConfig option was removed in 18.0 and was deleted here. The date and intl-date cell types use the browser's native date input instead of Pikaday.
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

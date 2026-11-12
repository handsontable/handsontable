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
    { type: 'date', correctFormat: true, datePickerConfig: { firstDay: 1 } },
    { type: 'numeric', numericFormat: { pattern: '0,0.00', culture: 'de-DE' } },
  ],
};
</script>

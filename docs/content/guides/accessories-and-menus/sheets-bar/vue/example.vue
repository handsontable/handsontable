<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  sheetsBar: {
    sheets: [
      {
        name: 'Budget',
        data: [
          ['Marketing', 4200, 5100],
          ['Engineering', 18700, 19200],
          ['Operations', 3100, 2900],
        ],
        settings: {
          colHeaders: ['Category • A', 'Q1 2026 • B', 'Q2 2026 • C'],
        },
      },
      {
        name: 'Notes',
        data: [
          ['Reviewed by Ana García on 2026-03-14'],
          ['Pending sign-off from Finance'],
        ],
        settings: {
          colHeaders: ['Note • A'],
        },
      },
    ],
    activeSheet: 0,
  },
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 240,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example">
    <HotTable :settings="hotSettings" />
  </div>
</template>

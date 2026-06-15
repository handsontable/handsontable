<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5'],
  ],
  rowHeaders: true,
  colHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  stretchH: 'all',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  customBorders: [
    {
      range: {
        from: {
          row: 1,
          col: 1,
        },
        to: {
          row: 3,
          col: 4,
        },
      },
      top: {
        width: 2,
        color: '#5292F7',
        style: 'dotted',
      },
      bottom: {
        width: 2,
        color: 'red',
      },
      start: {
        width: 2,
        color: 'orange',
        style: 'dashed',
      },
      end: {
        width: 2,
        color: 'magenta',
      },
    },
    {
      row: 2,
      col: 2,
      start: {
        width: 2,
        color: 'red',
      },
      end: {
        width: 1,
        color: 'green',
      },
    },
  ],
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>

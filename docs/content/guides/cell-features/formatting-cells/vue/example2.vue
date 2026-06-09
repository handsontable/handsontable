<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import type { BaseRenderer } from 'handsontable/renderers';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const customStylesRenderer: BaseRenderer = (hotInstance, TD, ...rest) => {
  textRenderer(hotInstance, TD, ...rest);
  TD.style.fontWeight = 'bold';
  TD.style.color = 'green';
  TD.style.background = '#d7f1e1';
};

registerRenderer('customStylesRenderer', customStylesRenderer);

const hotSettings: GridSettings = {
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ],
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  cell: [
    {
      row: 0,
      col: 0,
      renderer: customStylesRenderer,
    },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

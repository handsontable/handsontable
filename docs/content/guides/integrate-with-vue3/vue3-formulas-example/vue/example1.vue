<script setup lang="ts">
import { ref, markRaw } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hfRaw = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  })
);

const hotSettings = ref<GridSettings>({
  data: [
    ['4', '=IF(A1>4, "TRUE", "FALSE")', 'C1'],
    ['2', 'B2', '=A1+A2'],
    ['3', 'B3', 'C3'],
    ['4', 'B4', 'C4'],
    ['5', 'B5', 'C5'],
    ['6', 'B6', 'C6'],
  ],
  colHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  formulas: {
    engine: hfRaw,
  },
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const data: string[][] = [
  ['Acme Corp', '=HYPERLINK("https://example.com/acme", "acme.example.com")'],
  ['Vertex Industries', '=HYPERLINK("https://example.com/vertex", "vertex.example.com")'],
  ['Harbor Goods', '=HYPERLINK("https://example.com/harbor", "harbor.example.com")'],
  ['Alpine Supply Co.', '=HYPERLINK("https://example.com/alpine", "alpine.example.com")'],
  ['Summit Logistics', '=HYPERLINK("https://example.com/summit", "summit.example.com")'],
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Company', 'Website'],
  rowHeaders: true,
  height: 'auto',
  colWidths: [180, 220],
  formulas: { engine: markRaw(HyperFormula), hyperlinks: true },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example-hyperlinks">
    <HotTable :settings="hotSettings" />
  </div>
</template>

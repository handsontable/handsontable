<script setup lang="ts">
import { ref, h, render, defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';

registerAllModules();

// A small Vue component used as a cell renderer.
const CellDisplay = defineComponent({
  props: {
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    value: { type: String, default: '' },
  },
  render() {
    return h('span', [
      h('i', { style: 'color:#a9a9a9' }, `Row: ${this.row}, column: ${this.col},`),
      ' value: ',
      h('strong', this.value),
    ]);
  },
});

const componentRenderer: BaseRenderer = (instance, td, row, col, _prop, value) => {
  render(h(CellDisplay, { row, col, value: String(value) }), td);

  return td;
};

const hotSettings = ref<GridSettings>({
  data: [
    ['Mercedes A 160', 'Q1 2024', '7 200'],
    ['Citroen C4 Coupe', 'Q2 2024', '8 330'],
    ['Audi A4 Avant', 'Q3 2024', '33 900'],
    ['Opel Astra', 'Q4 2024', '5 000'],
    ['BMW 320i Coupe', 'Q1 2025', '30 500'],
  ],
  colHeaders: ['Model', 'Quarter', 'Price (EUR)'],
  columns: [
    { renderer: componentRenderer },
    { renderer: componentRenderer },
    { renderer: componentRenderer },
  ],
  colWidths: 250,
  autoRowSize: false,
  autoColumnSize: false,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

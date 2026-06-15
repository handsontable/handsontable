<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import type { BaseRenderer } from 'handsontable/renderers';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const colors = ['yellow', 'red', 'orange', 'green', 'blue', 'gray', 'black', 'white'];

const yellowRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);
  td.style.backgroundColor = 'yellow';
};

const greenRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);
  td.style.backgroundColor = 'green';
};

const hotSettings = ref<GridSettings>({
  data: [
    { id: 1, name: 'Ted', isActive: true, color: 'orange', date: '2015-01-01' },
    { id: 2, name: 'John', isActive: false, color: 'black', date: null },
    { id: 3, name: 'Al', isActive: true, color: 'red', date: null },
    { id: 4, name: 'Ben', isActive: false, color: 'blue', date: null },
  ],
  colHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  columns: [
    { data: 'id', type: 'text' },
    // 'text' is default, you don't actually need to declare it
    { data: 'name', renderer: yellowRenderer },
    // use default 'text' cell type but overwrite its renderer with yellowRenderer
    { data: 'isActive', type: 'checkbox' },
    {
      data: 'date',
      type: 'intl-date',
      locale: 'en-US',
      dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
    },
    { data: 'color', type: 'autocomplete', source: colors },
  ],
  cell: [{ row: 1, col: 0, renderer: greenRenderer }],
  cells(row, col) {
    if (row === 0 && col === 0) {
      this.renderer = greenRenderer;

      return { renderer: this.renderer };
    }

    return {};
  },
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

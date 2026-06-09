<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { registerRenderer } from 'handsontable/renderers';
import type { BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import type { GridSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';
import { ref, useTemplateRef } from 'vue';

registerAllModules();

const data: (string | number)[][] = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', -5, '', 12, 13],
  ['2018', '', -11, 14, 13],
  ['2019', '', 15, -12, 'readOnly'],
];

const firstRowRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);
  td.style.fontWeight = 'bold';
  td.style.color = 'green';
  td.style.background = '#CEC';
};

const negativeValueRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  textRenderer(instance, td, row, col, prop, value, cellProperties);

  if (parseInt(String(value), 10) < 0) {
    td.className = 'make-me-red';
  }

  if (!value || value === '') {
    td.style.background = 'rgb(238, 238, 238, 0.4)';
  } else {
    if (instance.getDataAtCell(0, col) === 'Nissan') {
      td.style.fontStyle = 'italic';
    }

    td.style.background = '';
  }
};

registerRenderer('negativeValueRenderer', negativeValueRenderer);

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings: GridSettings = {
  data,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  afterSelection(_row, _col, row2, col2) {
    const hot = hotTableRef.value?.hotInstance;

    if (!hot) {
      return;
    }

    const meta = hot.getCellMeta(row2, col2);

    if (meta.readOnly) {
      hot.updateSettings({
        fillHandle: false,
      });
    } else {
      hot.updateSettings({
        fillHandle: true,
      });
    }
  },
  cells(row, col) {
    const cellProperties: Handsontable.CellMeta = {};

    if (row === 0 || (data[row] && data[row][col] === 'readOnly')) {
      cellProperties.readOnly = true;
    }

    if (row === 0) {
      cellProperties.renderer = firstRowRenderer;
    } else {
      cellProperties.renderer = 'negativeValueRenderer';
    }

    return cellProperties;
  },
  autoWrapRow: true,
  autoWrapCol: true,
};
</script>

<template>
  <div id="example1">
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

<style>
.make-me-red {
  color: #FF5A12 !important;
}
</style>

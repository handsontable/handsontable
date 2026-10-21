<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { type BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import type Handsontable from 'handsontable/base';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const templateValues = ['one', 'two', 'three'];
const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', 'Be', 4, 9.012, 11],
  ['Boron', 'B', 5, 10.81, 15],
];

function isEmptyRow(instance: Handsontable, row: number) {
  const rowData = instance.getDataAtRow(row);

  for (let i = 0, ilen = rowData.length; i < ilen; i++) {
    if (rowData[i] !== null) {
      return false;
    }
  }

  return true;
}

const defaultValueRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  if (value === null && isEmptyRow(instance, row)) {
    value = templateValues[col];
    td.style.color = '#999';
  } else {
    td.style.color = '';
  }

  textRenderer(instance, td, row, col, prop, value, cellProperties);
};

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
  minSpareRows: 1,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  cells() {
    return { renderer: defaultValueRenderer };
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

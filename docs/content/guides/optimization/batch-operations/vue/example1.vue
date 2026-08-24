<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const counter = ref(0);
const output = ref('');

const dataInit: GridSettings['data'] = [
  [1, 'Gary Nash', 'Speckled trousers', 'S', 1, 'yes'],
  [2, 'Gloria Brown', '100% Stainless sweater', 'M', 2, 'no'],
  [3, 'Ronald Carver', 'Sunny T-shirt', 'S', 1, 'no'],
  [4, 'Samuel Watkins', 'Floppy socks', 'S', 3, 'no'],
  [5, 'Stephanie Huddart', 'Bushy-bush cap', 'XXL', 1, 'no'],
  [6, 'Madeline McGillivray', 'Long skirt', 'L', 1, 'no'],
  [7, 'Jai Moor', 'Happy dress', 'XS', 1, 'no'],
  [8, 'Ben Lower', 'Speckled trousers', 'M', 1, 'no'],
  [9, 'Ali Tunbridge', 'Speckled trousers', 'M', 2, 'no'],
  [10, 'Archie Galvin', 'Regular shades', 'uni', 10, 'no'],
];

const data2 = [[11, 'Gavin Elle', 'Floppy socks', 'XS', 3, 'yes']];
const data3 = [
  [12, 'Gary Erre', 'Happy dress', 'M', 1, 'no'],
  [13, 'Anna Moon', 'Unicorn shades', 'uni', 200, 'no'],
  [14, 'Elise Eli', 'Regular shades', 'uni', 1, 'no'],
];

const hotSettings = ref<GridSettings>({
  data: dataInit,
  width: 'auto',
  height: 'auto',
  colHeaders: ['ID', 'Customer name', 'Product name', 'Size', 'qty', 'Return'],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function logOutput(msg: string) {
  counter.value += 1;
  output.value = `[${counter.value}] ${msg}\n${output.value}`;
}

function alterTable() {
  const hot = hotRef.value?.hotInstance;

  hot?.alter('insert_row_above', 10, 10);
  hot?.alter('insert_col_start', 6, 1);
  hot?.populateFromArray(10, 0, data2);
  hot?.populateFromArray(11, 0, data3);
  hot?.setCellMeta(2, 2, 'className', 'green-bg');
  hot?.setCellMeta(4, 2, 'className', 'green-bg');
  hot?.setCellMeta(5, 2, 'className', 'green-bg');
  hot?.setCellMeta(6, 2, 'className', 'green-bg');
  hot?.setCellMeta(8, 2, 'className', 'green-bg');
  hot?.setCellMeta(9, 2, 'className', 'green-bg');
  hot?.setCellMeta(10, 2, 'className', 'green-bg');
  hot?.alter('remove_col', 6, 1);
  hot?.alter('remove_row', 10, 10);
  hot?.setCellMeta(0, 5, 'className', 'red-bg');
  hot?.setCellMeta(10, 5, 'className', 'red-bg');
  hot?.render();
}

function buttonWithoutClick() {
  const t1 = performance.now();

  alterTable();

  const t2 = performance.now();

  logOutput(`Time without batch ${(t2 - t1).toFixed(2)}ms`);
}

function buttonWithClick() {
  const hot = hotRef.value?.hotInstance;
  const t1 = performance.now();

  hot?.batch(alterTable);

  const t2 = performance.now();

  logOutput(`Time with batch ${(t2 - t1).toFixed(2)}ms`);
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button id="buttonWithout" class="button button--primary" @click="buttonWithoutClick">
          Run without batch method
        </button>
        <button id="buttonWith" class="button button--primary" @click="buttonWithClick">
          Run with batch method
        </button>
      </div>
      <output class="console" id="output">
        {{ output || 'Here you will see the log' }}
      </output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

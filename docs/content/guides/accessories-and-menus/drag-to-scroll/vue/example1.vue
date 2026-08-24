<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colHeaders: string[] = ['Cost Center'];
let year = 2021;
let monthIndex = 0;

while (colHeaders.length < 50) {
  colHeaders.push(`${months[monthIndex]} ${year}`);
  monthIndex += 1;

  if (monthIndex >= months.length) {
    monthIndex = 0;
    year += 1;
  }
}

const tableData: (string | number)[][] = [];

for (let row = 0; row < 50; row++) {
  const rowData: (string | number)[] = [`CC-${1000 + row}`];

  for (let col = 0; col < 49; col++) {
    rowData.push(2000 + row * 100 + col * 50);
  }

  tableData.push(rowData);
}

const hotSettings = ref<GridSettings>({
  data: tableData,
  colHeaders,
  width: 500,
  height: 220,
  rowHeaders: true,
  dragToScroll: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

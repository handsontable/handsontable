<script setup lang="ts">
import { computed, ref } from 'vue';
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

const intervalMin = ref(20);
const intervalMax = ref(500);
const rampDistance = ref(120);

const hotSettings = computed<GridSettings>(() => ({
  data: tableData,
  colHeaders,
  width: 500,
  height: 220,
  rowHeaders: true,
  dragToScroll: {
    interval: { min: intervalMin.value, max: intervalMax.value },
    rampDistance: rampDistance.value,
  },
  licenseKey: 'non-commercial-and-evaluation',
}));
</script>

<template>
  <div id="example2">
    <div style="display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 16px">
      <label style="display: flex; flex-direction: column; gap: 4px; font: 13px/1.4 sans-serif; color: #334155">
        <b style="font-family: monospace">interval.min: {{ intervalMin }} ms</b>
        <input
          v-model.number="intervalMin"
          type="range"
          min="10"
          max="200"
          step="10"
          style="width: 200px; cursor: pointer"
        >
      </label>
      <label style="display: flex; flex-direction: column; gap: 4px; font: 13px/1.4 sans-serif; color: #334155">
        <b style="font-family: monospace">interval.max: {{ intervalMax }} ms</b>
        <input
          v-model.number="intervalMax"
          type="range"
          min="100"
          max="1000"
          step="50"
          style="width: 200px; cursor: pointer"
        >
      </label>
      <label style="display: flex; flex-direction: column; gap: 4px; font: 13px/1.4 sans-serif; color: #334155">
        <b style="font-family: monospace">rampDistance: {{ rampDistance }} px</b>
        <input
          v-model.number="rampDistance"
          type="range"
          min="20"
          max="300"
          step="10"
          style="width: 200px; cursor: pointer"
        >
      </label>
    </div>
    <HotTable :settings="hotSettings" />
  </div>
</template>

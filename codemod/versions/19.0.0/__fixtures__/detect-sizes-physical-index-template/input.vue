<template>
  <hot-table :data="rows" :col-widths="[10, 20]" license-key="my-own-key"></hot-table>
  <HotTable :data="rows" :row-heights="(row) => 20 + row" license-key="my-own-key" />
  <hot-table :data="rows" :settings="{ minRowHeights: [20, 30] }" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :min-row-heights="function (row) { return 20 + row; }" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :col-widths="50" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :col-widths="widths" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" col-widths="[10, 20]" license-key="my-own-key"></hot-table>
  <div :col-widths="[1, 2]"></div>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
const settings = { data: rows };
const isTall = true;
const widths = [10, 20];
</script>

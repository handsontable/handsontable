<template>
  <hot-table :data="rows" :height="'auto'" license-key="my-own-key"></hot-table>
  <HotTable :data="rows" :height='"auto"' license-key="my-own-key" />
  <hot-table :data="rows" :height="`auto`" license-key="my-own-key"></hot-table>
  <hot-table :settings="{ height: 'auto' }" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :height="500" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :height="'100%'" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :height="isTall ? 'auto' : 500" license-key="my-own-key"></hot-table>
  <hot-table :settings="settings" license-key="my-own-key"></hot-table>
  <div :height="'auto'"></div>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
const settings = { data: rows };
const isTall = true;
const widths = [10, 20];
</script>

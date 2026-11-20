<template>
  <HotTable :data="rows" :getValue="read" />
  <HotTable :data="rows" :readOnly="true" />
  <HotTable :data="rows"><HotColumn :handsontable="settings" data="id" /></HotTable>
</template>

<script setup>
import { HotTable, HotColumn } from '@handsontable/vue3';

const rows = [[1]];
</script>

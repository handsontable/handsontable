<template>
  <hot-table :data="rows" height="auto" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" height="500" license-key="my-own-key"></hot-table>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
</script>

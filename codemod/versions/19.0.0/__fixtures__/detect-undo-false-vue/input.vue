<template>
  <hot-table :data="rows" :undo="false" license-key="my-own-key"></hot-table>
  <hot-table :data="rows" :undo="true" license-key="my-own-key"></hot-table>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
</script>

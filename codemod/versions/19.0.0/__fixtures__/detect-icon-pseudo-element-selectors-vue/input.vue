<template>
  <hot-table :data="rows" license-key="my-own-key"></hot-table>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
</script>

<style lang="scss">
.changeType {
  &::before {
    color: blue;
  }
}
</style>

<style scoped>
.collapsibleIndicator::after {
  content: '+';
}
</style>

<style>
.my-card::before {
  content: '';
}
</style>

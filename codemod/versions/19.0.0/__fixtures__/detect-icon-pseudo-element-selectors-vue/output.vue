<template>
  <hot-table :data="rows" license-key="my-own-key"></hot-table>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
</script>

<style lang="scss">
.changeType {
  /* TODO(handsontable-codemod 19.0.0/icon-pseudo-element-selectors): Replace this pseudo-element selector with the matching .ht-icon-<name> class. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#icons-are-rendered-as-i-elements */
  &::before {
    color: blue;
  }
}
</style>

<style scoped>
/* TODO(handsontable-codemod 19.0.0/icon-pseudo-element-selectors): Replace this pseudo-element selector with the matching .ht-icon-<name> class. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#icons-are-rendered-as-i-elements */
.collapsibleIndicator::after {
  content: '+';
}
</style>

<style>
.my-card::before {
  content: '';
}
</style>

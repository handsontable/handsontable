<template>
  <div class="card">{{ title }}</div>
</template>

<script setup lang="ts">
const title = 'A card of the project';
</script>

<style lang="scss">
.changeType {
  /* TODO(handsontable-codemod 19.0.0/icon-pseudo-element-selectors): Check that this selector targets the Handsontable grid. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#icons-are-rendered-as-i-elements */
  &::before {
    color: blue;
  }
}
</style>

<style scoped>
/* TODO(handsontable-codemod 19.0.0/icon-pseudo-element-selectors): Check that this selector targets the Handsontable grid. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#icons-are-rendered-as-i-elements */
.collapsibleIndicator::after {
  content: '+';
}

.my-card::before {
  content: '';
}
</style>

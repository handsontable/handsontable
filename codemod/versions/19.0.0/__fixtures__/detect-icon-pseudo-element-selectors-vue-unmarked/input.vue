<template>
  <div class="card">{{ title }}</div>
</template>

<script setup lang="ts">
const title = 'A card of the project';
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

.my-card::before {
  content: '';
}
</style>

<template>
  <div class="wrapper" style="--ht-wrapper-border-radius: 6px">
    <hot-table :settings="settings" />
  </div>
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { onMounted } from 'vue';

const settings = { data: [[1, 2]], licenseKey: 'non-commercial-and-evaluation' };

onMounted(() => {
  document.documentElement.style.setProperty("--ht-border-radius", '8px');
});
</script>

<style scoped lang="scss">
.wrapper {
  --ht-border-radius: 8px;
  --ht-wrapper-border-radius-extra: 2px;

  :deep(.handsontable) {
    border-radius: var(--ht-border-radius, 4px);
  }
}
</style>

<style lang="less">
.wrapper { --ht-wrapper-border-radius: 8px; }
</style>

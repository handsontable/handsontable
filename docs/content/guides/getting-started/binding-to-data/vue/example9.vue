<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
</script>

<template>
  <div id="example9">
    <HotTable :settings="hotSettings" />
  </div>
</template>

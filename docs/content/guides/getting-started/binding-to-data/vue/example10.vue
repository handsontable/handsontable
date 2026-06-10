<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotSettings = ref<GridSettings>({
  data: [
    ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
    ['2017', 10, 11, 12, 13, 15, 16],
    ['2018', 10, 11, 12, 13, 15, 16],
    ['2019', 10, 11, 12, 13, 15, 16],
    ['2020', 10, 11, 12, 13, 15, 16],
    ['2021', 10, 11, 12, 13, 15, 16],
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

onMounted(() => {
  hotRef.value?.hotInstance?.setDataAtCell(0, 1, 'Ford');
});
</script>

<template>
  <div id="example10">
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

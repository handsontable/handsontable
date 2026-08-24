<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings = {
  data: [
    ['A1', 'B1', 'C1', 'D1'],
    ['A2', 'B2', 'C2', 'D2'],
    ['A3', 'B3', 'C3', 'D3'],
    ['A4', 'B4', 'C4', 'D4'],
  ],
  colHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};

const selectCell = () => {
  // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button @click="selectCell">Select cell B2</button>
      </div>
    </div>
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

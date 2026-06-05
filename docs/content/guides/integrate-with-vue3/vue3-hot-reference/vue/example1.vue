<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotTableComponent = ref<InstanceType<typeof HotTable> | null>(null);
const hotSettings = ref<GridSettings>({
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
  licenseKey: 'non-commercial-and-evaluation'
});

function swapHotData() {
  hotTableComponent.value?.hotInstance?.loadData([['new', 'data']]);
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button v-on:click="swapHotData">Load new data</button>
      </div>
    </div>

    <HotTable ref="hotTableComponent" :settings="hotSettings" /><br/>
  </div>
</template>

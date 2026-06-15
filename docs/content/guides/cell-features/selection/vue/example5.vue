<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings = ref<GridSettings>({
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5'],
    ['A6', 'B6', 'C6', 'D6', 'E6', 'F6'],
  ],
  width: 'auto',
  height: 'auto',
  colWidths: 100,
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const selectCell = () => {
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
};

const selectRange = () => {
  hotTableRef.value?.hotInstance?.selectCell(1, 1, 3, 3);
};

const deselect = () => {
  hotTableRef.value?.hotInstance?.deselectCell();
};
</script>

<template>
  <div id="example5">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" @click="selectCell">
          Select cell B2
        </button>
        <button type="button" @click="selectRange">
          Select range B2:D4
        </button>
        <button type="button" @click="deselect">
          Deselect
        </button>
      </div>
    </div>
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

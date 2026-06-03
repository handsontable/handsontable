<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotTableRef = ref<InstanceType<typeof HotTable> | null>(null);

const hotSettings = ref<GridSettings>({
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1'],
    ['A2', 'B2', 'C2', 'D2', 'E2'],
    ['A3', 'B3', 'C3', 'D3', 'E3'],
    ['A4', 'B4', 'C4', 'D4', 'E4'],
    ['A5', 'B5', 'C5', 'D5', 'E5'],
  ],
  rowHeaders: true,
  colHeaders: true,
  outsideClickDeselects: false,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const copyBtnClickCallback = () => {
  document.execCommand('copy');
};

const cutBtnClickCallback = () => {
  document.execCommand('cut');
};

const copyBtnMousedownCallback = () => {
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
};

const cutBtnMousedownCallback = () => {
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
};
</script>

<template>
  <div id="example3">
    <div class="example-controls-container">
      <div class="controls">
        <button
          id="copy"
          type="button"
          @mousedown="copyBtnMousedownCallback"
          @click="copyBtnClickCallback"
        >
          Select and copy cell B2
        </button>
        <button
          id="cut"
          type="button"
          @mousedown="cutBtnMousedownCallback"
          @click="cutBtnClickCallback"
        >
          Select and cut cell B2
        </button>
      </div>
    </div>
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  data: [[0, 1, 2], ['3c', '4b', 5], [], []],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
    },
  ],
  height: 'auto',
});

function throwErrors() {
  hotRef.value?.hotInstance?.updateSettings({
    columnSummary: [
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 0,
        reversedRowCoords: true,
        suppressDataTypeErrors: false,
      },
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 1,
        reversedRowCoords: true,
        suppressDataTypeErrors: false,
      },
    ],
  });
}
</script>

<template>
  <div id="example11">
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" @click="throwErrors">
          Throw data type errors
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

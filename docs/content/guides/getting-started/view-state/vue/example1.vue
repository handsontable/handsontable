<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const output = ref('Sort, filter, hide, or resize columns, then click "Save view"');

// The saved view is plain JSON, so you can keep it in a variable, `localStorage`, or on a server.
let savedView: string | null = null;

const hotSettings: GridSettings = {
  data: [
    ['Laptop Pro 14', 'Computers', 1499, 24, 4.7],
    ['Wireless Mouse', 'Accessories', 29, 310, 4.4],
    ['Mechanical Keyboard', 'Accessories', 119, 85, 4.8],
    ['4K Monitor 27"', 'Displays', 449, 41, 4.6],
    ['USB-C Dock', 'Accessories', 189, 67, 4.2],
    ['Tablet Air 11', 'Computers', 599, 52, 4.5],
    ['Webcam HD', 'Accessories', 79, 140, 4.1],
    ['Ultrawide Monitor 34"', 'Displays', 799, 18, 4.9],
  ],
  colHeaders: ['Product', 'Category', 'Price', 'Stock', 'Rating'],
  rowHeaders: true,
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  contextMenu: true,
  hiddenColumns: { indicators: true },
  manualColumnResize: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
};

function saveClickCallback() {
  const hot = hotRef.value!.hotInstance!;

  savedView = JSON.stringify(hot.getPlugin('viewState').getViewState());
  output.value = 'View saved';
}

function restoreClickCallback() {
  const hot = hotRef.value!.hotInstance!;

  if (savedView === null) {
    output.value = 'Save a view first';

    return;
  }

  const { skipped } = hot.getPlugin('viewState').setViewState(JSON.parse(savedView));

  output.value = skipped.length === 0
    ? 'View restored'
    : `View restored, skipped: ${skipped.map(({ part, reason }) => `${part} (${reason})`).join(', ')}`;
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button id="save" class="button button--primary button--blue" @click="saveClickCallback">
          Save view
        </button>
        <button id="restore" class="button button--primary button--blue" @click="restoreClickCallback">
          Restore view
        </button>
      </div>
      <output class="console" id="output">{{ output }}</output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>

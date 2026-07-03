<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Harbor Goods', 'Electronics', 142],
    ['SKU-0093', 'Alpine Supply Co.', 'Apparel', 67],
    ['SKU-2210', 'Harbor Goods', 'Electronics', 0],
    ['SKU-7734', 'Nordic Traders', 'Home Goods', 58],
    ['SKU-1145', 'Alpine Supply Co.', 'Apparel', 213],
  ],
  colHeaders: ['SKU', 'Supplier', 'Category', 'Quantity'],
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const toggleAutoWrapRow = (event: Event) => {
  const hot = hotTableRef.value?.hotInstance;

  hot?.updateSettings({ autoWrapRow: (event.target as HTMLInputElement).checked });
};

const toggleAutoWrapCol = (event: Event) => {
  const hot = hotTableRef.value?.hotInstance;

  hot?.updateSettings({ autoWrapCol: (event.target as HTMLInputElement).checked });
};
</script>

<template>
  <div id="example6">
    <div class="example-controls-container">
      <div class="controls">
        <label>
          <input type="checkbox" checked @change="toggleAutoWrapRow">
          Wrap at the left/right edges (autoWrapRow)
        </label>
        <label>
          <input type="checkbox" checked @change="toggleAutoWrapCol">
          Wrap at the top/bottom edges (autoWrapCol)
        </label>
      </div>
      <p>
        Select a cell, then press <kbd>Tab</kbd> or <kbd>&rarr;</kbd> at the end of a row, or <kbd>Enter</kbd> or
        <kbd>&darr;</kbd> at the bottom of a column, to see the effect.
      </p>
    </div>
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

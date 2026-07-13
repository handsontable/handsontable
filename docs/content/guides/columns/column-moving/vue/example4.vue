<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const allowColumnMoving = ref(false);

const hotSettings: GridSettings = {
  data: [
    ['SKU-4821', 'Wireless keyboard', 'Harbor Goods', 142],
    ['SKU-0093', 'USB-C dock', 'Vertex Supply', 67],
    ['SKU-3148', '27-inch monitor', 'Alpine Supply Co.', 24],
    ['SKU-7720', 'Laptop stand', 'Northstar Wholesale', 89],
    ['SKU-1056', 'Noise-canceling headset', 'Summit Distribution', 35],
  ],
  colHeaders: ['SKU', 'Product', 'Supplier', 'Stock'],
  rowHeaders: true,
  manualColumnMove: true,
  beforeColumnMove: () => allowColumnMoving.value,
  stretchH: 'all',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
};
</script>

<template>
  <div id="example4">
    <div class="example-controls-container">
      <div class="controls">
        <label>
          <input v-model="allowColumnMoving" type="checkbox" />
          Allow column moving
        </label>
      </div>
    </div>
    <HotTable :settings="hotSettings" />
  </div>
</template>

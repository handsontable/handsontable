<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);

const data = [
  ['SKU-001', 'Alkaline AA 4pk', 240, 40, 'A-12'],
  ['SKU-002', 'USB-C cable 1m', 18, 24, 'B-03'],
  ['SKU-003', 'Notebook A5 ruled', 0, 30, 'C-01'],
  ['SKU-004', 'Wireless mouse', 6, 15, 'B-07'],
  ['SKU-005', 'HDMI cable 2m', 2, 10, 'A-04'],
  ['SKU-006', 'Desk lamp LED', 45, 12, 'D-02'],
  ['SKU-007', 'Laptop stand aluminum', 0, 8, 'C-14'],
  ['SKU-008', 'Mechanical keycap set', 112, 20, 'B-01'],
];

const hotSettings = ref<GridSettings>({
  data,
  columns: [
    { data: 0, type: 'text', width: 90 },
    { data: 1, type: 'text', width: 200 },
    { data: 2, type: 'numeric', width: 100 },
    { data: 3, type: 'numeric', width: 95 },
    { data: 4, type: 'text', width: 70 },
  ],
  colHeaders: ['SKU', 'Product', 'Qty on hand', 'Reorder at', 'Bin'],
  rowHeaders: true,
  width: '100%',
  height: 280,
  notification: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function getPlugin() {
  return hotRef.value?.hotInstance?.getPlugin('notification');
}

function onSave(): void {
  getPlugin()?.showMessage({
    title: 'Saved',
    message: 'Inventory updates were written.',
    variant: 'success',
    position: 'top-end',
    duration: 2500,
  });
}

function onSyncError(): void {
  const plugin = getPlugin();

  if (!plugin) {
    return;
  }

  plugin.showMessage({
    title: 'Sync failed',
    message: 'The service is unavailable. Retry when your connection is stable.',
    variant: 'error',
    position: 'bottom-end',
    duration: 0,
    actions: [
      {
        label: 'Retry',
        type: 'primary',
        callback: () => {
          plugin.hideAll();
          plugin.showMessage({
            message: 'Sync completed.',
            variant: 'success',
            position: 'bottom-end',
          });
        },
      },
      { label: 'Dismiss', type: 'secondary', callback: () => plugin.hideAll() },
    ],
  });
}

function onLowStock(): void {
  getPlugin()?.showMessage({
    title: 'Review quantities',
    message:
      'SKUs below reorder: USB-C cable 1m, Wireless mouse, HDMI cable 2m. Out of stock: Notebook A5 ruled, Laptop stand.',
    variant: 'warning',
    position: 'top-start',
    duration: 6000,
  });
}
</script>

<template>
  <div id="example2">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" class="button button--primary" @click="onSave">Save</button>
        <button type="button" class="button button--primary" @click="onSyncError">Sync error</button>
        <button type="button" class="button button--primary" @click="onLowStock">Low stock</button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

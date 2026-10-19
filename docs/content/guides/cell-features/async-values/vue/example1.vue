<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const products: Record<string, string> = {
  'A-100': 'Desk lamp',
  'B-200': 'Office chair',
  'C-300': 'Standing desk',
  'D-400': 'Monitor arm',
};

// A stand-in for a server request: it answers after a delay, and stops when the signal is aborted.
function lookUpProduct(sku: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (products[sku]) {
        resolve(products[sku]);
      } else {
        reject(new Error(`Unknown SKU: ${sku}`));
      }
    }, 600 + Math.random() * 1400);

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

function lookUpRow(row: number | null) {
  const hot = hotRef.value?.hotInstance;

  if (!hot || row === null) {
    return;
  }

  hot.getPlugin('asyncValues').setAsyncValue(row, 1, ({ physicalRow, signal }) => (
    lookUpProduct(hot.getSourceDataAtCell(physicalRow, 'sku') as string, signal)
  ), { dependsOn: ['sku'] });
}

function lookUpAll() {
  const hot = hotRef.value?.hotInstance;

  for (let row = 0; row < (hot?.countRows() ?? 0); row++) {
    lookUpRow(row);
  }
}

const hotSettings = ref<GridSettings>({
  data: [
    { sku: 'A-100', product: '' },
    { sku: 'B-200', product: '' },
    { sku: 'X-999', product: '' },
    { sku: 'C-300', product: '' },
    { sku: 'D-400', product: '' },
  ],
  columns: [
    { data: 'sku', title: 'SKU' },
    { data: 'product', title: 'Product', readOnly: true },
  ],
  colWidths: [120, 220],
  rowHeaders: true,
  height: 'auto',
  asyncValues: true,
  // Look the product up again when its SKU changes.
  afterAsyncValueCancel(physicalRow, prop, reason) {
    if (reason === 'dependency') {
      lookUpRow(hotRef.value?.hotInstance?.toVisualRow(physicalRow) ?? null);
    }
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div class="example-controls-container">
    <div class="controls">
      <button class="button button--primary" @click="lookUpAll">Look up products</button>
    </div>
  </div>
  <div id="example1">
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

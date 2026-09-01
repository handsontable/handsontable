<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const skuValidator = (value: string, callback: (isValid: boolean) => void) => {
  callback(/^\d{6}$/.test(value));
};

const hotSettings = ref<GridSettings>({
  data: [
    { sku: '004821', supplier: 'Harbor Goods', quantity: 142 },
    { sku: '000093', supplier: 'Alpine Supply Co.', quantity: 0 },
    { sku: '017640', supplier: 'Harbor Goods', quantity: 67 },
    { sku: '002210', supplier: 'Crestline Wholesale', quantity: 310 },
    { sku: '008875', supplier: 'Alpine Supply Co.', quantity: 24 },
  ],
  colHeaders: ['SKU', 'Supplier', 'Quantity'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  columns: [
    { data: 'sku', type: 'text', validator: skuValidator, allowInvalid: false },
    { data: 'supplier', type: 'text' },
    { data: 'quantity', type: 'numeric' },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

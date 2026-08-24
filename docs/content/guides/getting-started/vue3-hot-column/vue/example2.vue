<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type ProductRow = {
  id: number;
  name: string;
  payment: { price: number; currency: string };
};

const hotData = ref<ProductRow[]>([
  { id: 1, name: 'Table tennis racket', payment: { price: 13, currency: 'PLN' } },
  { id: 2, name: 'Outdoor game ball', payment: { price: 14, currency: 'USD' } },
  { id: 3, name: 'Mountain bike', payment: { price: 300, currency: 'USD' } }
]);
const secondColumnSettings = ref<GridSettings>({
  title: 'Second column header'
});
const settings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
});
</script>

<template>
  <div id="example2">
    <HotTable :data="hotData" :settings="settings">
      <HotColumn title="ID" data="id" />
      <HotColumn :settings="secondColumnSettings" read-only="true" data="name" />
      <HotColumn title="Price" data="payment.price" />
      <HotColumn title="Currency" data="payment.currency" />
    </HotTable>
  </div>
</template>

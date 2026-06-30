<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const formatJP = { style: 'decimal', useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 };
const formatTR = { style: 'decimal', useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 };

const hotData = ref([
  {
    productName: 'Product A',
    JP_price: 1450.32,
    TR_price: 202.14,
  },
  {
    productName: 'Product B',
    JP_price: 2430.22,
    TR_price: 338.86,
  },
  {
    productName: 'Product C',
    JP_price: 3120.1,
    TR_price: 435.2,
  },
]);

const hotSettings = ref<GridSettings>({
  autoRowSize: false,
  autoColumnSize: false,
  columnSorting: true,
  colHeaders: ['Product name', 'Price in Japan', 'Price in Turkey'],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :data="hotData" :settings="hotSettings">
      <HotColumn data="productName" type="text" :width="150" />
      <HotColumn data="JP_price" type="numeric" locale="ja-JP" :numericFormat="formatJP" :width="150" />
      <HotColumn data="TR_price" type="numeric" locale="tr-TR" :numericFormat="formatTR" :width="150" />
    </HotTable>
  </div>
</template>

<script setup lang="ts">
import { HotTable, HotColumn } from '@handsontable/vue3';
import numbro from 'numbro';
import jaJP from 'numbro/languages/ja-JP';
import trTR from 'numbro/languages/tr-TR';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

numbro.registerLanguage(jaJP);
numbro.registerLanguage(trTR);

type ProductRow = {
  productName: string;
  JP_price: number;
  TR_price: number;
};

const formatJP = {
  pattern: '0,0.00 $',
  culture: 'ja-JP',
};
const formatTR = {
  pattern: '0,0.00 $',
  culture: 'tr-TR',
};
const hotData: ProductRow[] = [
  {
    productName: 'Product A',
    JP_price: 1.32,
    TR_price: 100.56,
  },
  {
    productName: 'Product B',
    JP_price: 2.22,
    TR_price: 453.5,
  },
  {
    productName: 'Product C',
    JP_price: 3.1,
    TR_price: 678.1,
  },
];
const settings: GridSettings = {
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
};
</script>

<template>
  <div id="example1">
    <HotTable :data="hotData" :settings="settings">
      <HotColumn
        title="Product name"
        data="productName"
        width="120"
        read-only="true"
      />
      <HotColumn
        title="Price in Japan"
        type="numeric"
        :numeric-format="formatJP"
        data="JP_price"
        width="120"
      />
      <HotColumn
        title="Price in Turkey"
        data="TR_price"
        type="numeric"
        :numeric-format="formatTR"
        width="120"
      />
    </HotTable>
  </div>
</template>

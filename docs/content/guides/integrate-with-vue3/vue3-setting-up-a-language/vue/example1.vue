<script setup>
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const formatJP = {
  style: 'currency',
  currency: 'JPY',
  minimumFractionDigits: 2,
};
const formatTR = {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
};
const hotData = [
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
const settings = {
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  locale: 'en-US',
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
        locale="ja-JP"
        :numeric-format="formatJP"
        data="JP_price"
        width="120"
      />
      <HotColumn
        title="Price in Turkey"
        data="TR_price"
        type="numeric"
        locale="tr-TR"
        :numeric-format="formatTR"
        width="120"
      />
    </HotTable>
  </div>
</template>

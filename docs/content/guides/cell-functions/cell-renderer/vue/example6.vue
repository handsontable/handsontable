<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

interface Holding {
  asset: string;
  btcValue: number;
  portfolioShare: number;
}

const data: Holding[] = [
  { asset: 'Bitcoin', btcValue: 12.45, portfolioShare: 452 },
  { asset: 'Ethereum', btcValue: 3.82, portfolioShare: 268 },
  { asset: 'Solana', btcValue: 1.15, portfolioShare: 134 },
  { asset: 'Cardano', btcValue: 0.47, portfolioShare: 81 },
  { asset: 'Polkadot', btcValue: 0.29, portfolioShare: 65 },
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Asset', 'BTC-equivalent value', 'Portfolio share'],
  columns: [
    { data: 'asset' },
    {
      data: 'btcValue',
      // Bitcoin (₿) isn't an ISO 4217 currency, so `numericFormat` can't format it.
      // `valueFormatter` prepends the symbol instead.
      valueFormatter(value: number) {
        return `₿${value.toFixed(4)}`;
      },
    },
    {
      data: 'portfolioShare',
      // Per mille (‰) isn't a unit sanctioned by `Intl.NumberFormat`, so `valueFormatter`
      // appends the symbol manually.
      valueFormatter(value: number) {
        return `${value}‰`;
      },
    },
  ],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example6">
    <HotTable :settings="hotSettings" />
  </div>
</template>

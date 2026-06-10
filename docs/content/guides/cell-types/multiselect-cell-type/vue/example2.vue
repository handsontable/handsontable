<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

interface ShipmentCategory {
  key: string;
  value: string;
}

const shipmentCategories: ShipmentCategory[] = [
  { key: 'electronics', value: 'Electronics and Gadgets' },
  { key: 'medical', value: 'Medical Supplies' },
  { key: 'auto-parts', value: 'Auto Parts' },
  { key: 'fresh-produce', value: 'Fresh Produce' },
  { key: 'textiles', value: 'Textiles' },
  { key: 'industrial', value: 'Industrial Equipment' },
  { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
  { key: 'consumer', value: 'Consumer Goods' },
  { key: 'machine-parts', value: 'Machine Parts' },
  { key: 'food', value: 'Food Products' },
];

const data: (string | ShipmentCategory[])[][] = [
  [
    'Los Angeles International Airport',
    [
      { key: 'electronics', value: 'Electronics and Gadgets' },
      { key: 'medical', value: 'Medical Supplies' },
    ],
  ],
  [
    "Chicago O'Hare International Airport",
    [
      { key: 'auto-parts', value: 'Auto Parts' },
      { key: 'fresh-produce', value: 'Fresh Produce' },
    ],
  ],
  [
    'Charles de Gaulle Airport',
    [
      { key: 'textiles', value: 'Textiles' },
      { key: 'industrial', value: 'Industrial Equipment' },
    ],
  ],
  [
    'Tokyo Haneda Airport',
    [
      { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
      { key: 'consumer', value: 'Consumer Goods' },
    ],
  ],
  [
    'Singapore Changi Airport',
    [
      { key: 'machine-parts', value: 'Machine Parts' },
      { key: 'food', value: 'Food Products' },
    ],
  ],
  [
    'Luton Airport',
    [
      { key: 'electronics', value: 'Electronics and Gadgets' },
      { key: 'pharmaceuticals', value: 'Pharmaceuticals' },
    ],
  ],
  [
    'Frankfurt Airport',
    [
      { key: 'industrial', value: 'Industrial Equipment' },
      { key: 'auto-parts', value: 'Auto Parts' },
      { key: 'consumer', value: 'Consumer Goods' },
    ],
  ],
  [
    'Sydney Kingsford Smith Airport',
    [
      { key: 'fresh-produce', value: 'Fresh Produce' },
      { key: 'food', value: 'Food Products' },
    ],
  ],
  [
    'Toronto Pearson International Airport',
    [
      { key: 'medical', value: 'Medical Supplies' },
      { key: 'textiles', value: 'Textiles' },
    ],
  ],
  [
    'Hong Kong International Airport',
    [
      { key: 'machine-parts', value: 'Machine Parts' },
      { key: 'electronics', value: 'Electronics and Gadgets' },
      { key: 'industrial', value: 'Industrial Equipment' },
    ],
  ],
  [
    'Heathrow Airport',
    [
      { key: 'textiles', value: 'Textiles' },
      { key: 'consumer', value: 'Consumer Goods' },
    ],
  ],
];

const hotSettings = ref<GridSettings>({
  data,
  columns: [
    {
      title: 'Airport',
    },
    {
      type: 'multiselect',
      source: shipmentCategories,
      title: 'Shipment',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'last',
  width: '100%',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const productData = [
  { sku: 'SKU-4821', name: 'Stainless Steel Water Bottle', supplier: 'Harbor Goods' },
  { sku: 'SKU-0093', name: 'Wireless Mouse', supplier: 'Alpine Supply Co.' },
  { sku: 'SKU-1170', name: 'Ergonomic Office Chair', supplier: 'Cascade Distributors' },
  { sku: 'SKU-2208', name: 'USB-C Charging Cable', supplier: 'Summit Trading' },
  { sku: 'SKU-3341', name: 'Aluminum Water Filter', supplier: 'Northgate Wholesale' },
  { sku: 'SKU-4412', name: 'Canvas Tote Bag', supplier: 'Nordic Traders' },
  { sku: 'SKU-5088', name: 'USB-C Hub', supplier: 'Harbor Goods' },
  { sku: 'SKU-6120', name: 'Ceramic Mug Set', supplier: 'Alpine Supply Co.' },
  { sku: 'SKU-7294', name: 'Desk Lamp', supplier: 'Cascade Distributors' },
  { sku: 'SKU-8015', name: 'Laptop Stand', supplier: 'Summit Trading' },
  { sku: 'SKU-9166', name: 'Bluetooth Speaker', supplier: 'Northgate Wholesale' },
  { sku: 'SKU-1042', name: 'Standing Desk', supplier: 'Nordic Traders' },
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Drinkware', 'Seattle'],
    ['SKU-0093', 'Wireless Mouse', 'Electronics', 'Denver'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Furniture', 'Portland'],
    ['SKU-2208', 'USB-C Charging Cable', 'Electronics', 'Austin'],
    ['SKU-3341', 'Aluminum Water Filter', 'Drinkware', 'Minneapolis'],
  ],
  colHeaders: ['SKU', 'Product', 'Category', 'Warehouse'],
  columns: [
    {},
    {
      type: 'handsontable',
      handsontable: {
        colHeaders: ['SKU', 'Product', 'Supplier'],
        autoColumnSize: true,
        data: productData,
        getValue() {
          const selection = this.getSelectedLast();

          // Get the product name of the clicked row and ignore header
          // coordinates (negative values)
          const row = this.getSourceDataAtRow(Math.max(selection?.[0] ?? 0, 0)) as { name: string };

          return row.name;
        },
      },
    },
    {
      type: 'dropdown',
      source: ['Drinkware', 'Electronics', 'Furniture', 'Apparel'],
    },
    {
      type: 'dropdown',
      source: [
        'Seattle',
        'Denver',
        'Portland',
        'Austin',
        'Minneapolis',
        'Boston',
        'Chicago',
        'Phoenix',
        'Atlanta',
        'Dallas',
        'San Jose',
        'Columbus',
      ],
    },
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  data: [
    ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
    ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
    ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
    ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
    ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
  ],
  colHeaders: ['Supplier', 'SKU', 'Warehouse', 'Product'],
  columns: [
    {
      type: 'autocomplete',
      source(_query: string, process: (data: string[]) => void) {
        fetch('/docs/scripts/json/autocomplete.json')
          .then((response) => response.json())
          .then((response) => process(response.data));
      },
      strict: true,
    },
    {}, // SKU is a default text column
    {}, // Warehouse is a default text column
    {}, // Product is a default text column
  ],
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>

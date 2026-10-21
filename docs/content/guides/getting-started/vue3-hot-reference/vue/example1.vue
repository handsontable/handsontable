<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings = {
  data: [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', '215'],
  ],
  colHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};

const selectCell = () => {
  // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
  hotTableRef.value?.hotInstance?.selectCell(1, 1);
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button @click="selectCell">Select cell B2</button>
      </div>
    </div>
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

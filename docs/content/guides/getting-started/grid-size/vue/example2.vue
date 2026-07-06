<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const UNIT_SIZES: Record<string, { width: string; height: string }> = {
  px: { width: '600px', height: '300px' },
  '%': { width: '75%', height: '75%' },
  em: { width: '37.5em', height: '18.75em' },
  rem: { width: '37.5rem', height: '18.75rem' },
  vh: { width: '50vh', height: '50vh' },
  vw: { width: '50vw', height: '50vw' },
};

const UNIT_CAPTIONS: Record<string, string> = {
  px: 'A fixed pixel size, independent of any parent element or font size.',
  '%': "A percentage of the parent container's size (the dashed box).",
  em: "A multiple of this element's own font size.",
  rem: "A multiple of the document's root font size.",
  vh: "A percentage of the browser viewport's height.",
  vw: "A percentage of the browser viewport's width.",
};

const unitKeys = Object.keys(UNIT_SIZES);
const unit = ref('px');
const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings = ref<GridSettings>({
  data: [
    ['SKU-4821', 'Wireless Mouse', 'Electronics', 'Harbor Goods', 142],
    ['SKU-0093', 'Canvas Tote Bag', 'Apparel', 'Alpine Supply Co.', 67],
    ['SKU-2210', 'USB-C Hub', 'Electronics', 'Harbor Goods', 0],
    ['SKU-7734', 'Ceramic Mug Set', 'Home Goods', 'Nordic Traders', 58],
    ['SKU-1145', 'Wool Scarf', 'Apparel', 'Alpine Supply Co.', 213],
    ['SKU-3399', 'Bluetooth Speaker', 'Electronics', 'Harbor Goods', 84],
    ['SKU-5567', 'Cotton T-Shirt', 'Apparel', 'Alpine Supply Co.', 310],
    ['SKU-8842', 'Desk Lamp', 'Home Goods', 'Nordic Traders', 45],
    ['SKU-6621', 'Laptop Stand', 'Electronics', 'Harbor Goods', 29],
    ['SKU-4470', 'Throw Blanket', 'Home Goods', 'Nordic Traders', 76],
    ['SKU-9983', 'Leather Wallet', 'Apparel', 'Alpine Supply Co.', 132],
    ['SKU-2287', 'Wireless Charger', 'Electronics', 'Harbor Goods', 97],
  ],
  colHeaders: ['SKU', 'Product', 'Category', 'Supplier', 'Quantity'],
  rowHeaders: true,
  width: UNIT_SIZES.px.width,
  height: UNIT_SIZES.px.height,
  licenseKey: 'non-commercial-and-evaluation',
});

const changeUnit = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  const size = UNIT_SIZES[value];

  unit.value = value;
  hotTableRef.value?.hotInstance?.updateSettings({ width: size.width, height: size.height });
};
</script>

<template>
  <div id="example2">
    <div class="example-controls-container">
      <div class="controls">
        <label for="unitSelect">Grid size unit</label>
        <select id="unitSelect" @change="changeUnit">
          <option v-for="key in unitKeys" :key="key" :value="key">{{ key }}</option>
        </select>
      </div>
      <p class="unit-caption">{{ UNIT_CAPTIONS[unit] }}</p>
    </div>
    <div id="exampleParent2">
      <HotTable ref="hotTableRef" :settings="hotSettings" />
    </div>
  </div>
</template>

<style>
#exampleParent2 {
  width: 800px;
  max-width: 100%;
  height: 400px;
  box-sizing: border-box;
  border: 1px dashed var(--sl-color-gray-5, #d1d5db);
}

#exampleParent2 > div {
  height: 100%;
}

.unit-caption {
  margin-top: 8px;
  color: var(--sl-color-text, #485164);
}
</style>

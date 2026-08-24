<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import type { BaseRenderer } from 'handsontable/renderers';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const customStylesRenderer: BaseRenderer = (hotInstance, TD, ...rest) => {
  textRenderer(hotInstance, TD, ...rest);
  TD.style.fontWeight = 'bold';
  TD.style.color = 'green';
  TD.style.background = '#d7f1e1';
};

registerRenderer('customStylesRenderer', customStylesRenderer);

const hotSettings: GridSettings = {
  data: [
    ['SKU-4821', 'Laptop Pro 15', 'Electronics', 149900, 42],
    ['SKU-0093', 'Wireless Mouse', 'Peripherals', 2999, 218],
    ['SKU-7712', 'USB-C Hub 7-port', 'Peripherals', 5499, 0],
    ['SKU-3305', 'Mech. Keyboard', 'Peripherals', 8999, 67],
    ['SKU-9140', '4K Monitor 27"', 'Electronics', 34999, 15],
  ],
  rowHeaders: true,
  colHeaders: ['SKU', 'Product', 'Category', 'Price ($)', 'Stock'],
  stretchH: 'all',
  cell: [
    {
      row: 0,
      col: 0,
      renderer: customStylesRenderer,
    },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

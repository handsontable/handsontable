<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

registerAllModules();

const dimmedTextRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);

  td.style.opacity = '0.6';
};

const hotSettings = ref<GridSettings>({
  data: [
    { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
    { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
    { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
    { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
    { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
  ],
  height: 'auto',
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'name',
      readOnly: true,
      renderer: dimmedTextRenderer,
    },
    {
      data: 'symbol',
    },
    {
      data: 'atomicNumber',
    },
    {
      data: 'atomicMass',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

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
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
  ],
  height: 'auto',
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      data: 'car',
      editor: false,
      renderer: dimmedTextRenderer,
    },
    {
      data: 'year',
      editor: 'numeric',
    },
    {
      data: 'chassis',
      editor: 'text',
    },
    {
      data: 'bumper',
      editor: 'text',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>

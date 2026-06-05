<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';

registerAllModules();

const imageRenderer: BaseRenderer = (_instance, td, _row, _col, _prop, value) => {
  const img = document.createElement('img');

  img.src = String(value);

  img.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });

  td.innerText = '';
  td.appendChild(img);

  return td;
};

const hotSettings = ref<GridSettings>({
  data: [
    ['A1', '/docs/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
    ['A2', '/docs/img/examples/javascript-the-good-parts.jpg']
  ],
  columns: [
    {},
    {
      renderer: imageRenderer
    }
  ],
  colHeaders: true,
  rowHeights: 55,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

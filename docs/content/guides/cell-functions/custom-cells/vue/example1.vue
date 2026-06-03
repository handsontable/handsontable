<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

function imageRenderer(
  _instance: unknown,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: unknown
): HTMLTableCellElement {
  const src = String(value ?? '');
  const img = document.createElement('img');

  img.src = src;
  img.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });

  td.innerText = '';
  td.appendChild(img);

  return td;
}

const hotSettings = ref<GridSettings>({
  data: [
    ['Professional JavaScript for Web Developers',
      '/docs/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
    ['JavaScript: The Good Parts',
      '/docs/img/examples/javascript-the-good-parts.jpg'],
  ],
  columns: [
    {},
    {
      renderer: imageRenderer,
    },
  ],
  colHeaders: true,
  rowHeights: 55,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

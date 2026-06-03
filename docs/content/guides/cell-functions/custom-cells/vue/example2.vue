<script setup lang="ts">
import { ref, h, render } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type ImageCellProps = { src: string };

const ImageCell = (props: ImageCellProps) =>
  h('img', {
    src: props.src,
    onMousedown: (event: MouseEvent) => event.preventDefault(),
  });

function imageComponentRenderer(
  _instance: unknown,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: unknown
): HTMLTableCellElement {
  const vnode = h(ImageCell, { src: String(value ?? '') });

  render(vnode, td);

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
      renderer: imageComponentRenderer,
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
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

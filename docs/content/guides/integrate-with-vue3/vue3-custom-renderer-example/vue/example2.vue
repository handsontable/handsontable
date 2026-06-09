<script setup lang="ts">
import { ref, h, render, defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';

registerAllModules();

const ImageCell = defineComponent({
  props: {
    src: { type: String, required: true },
  },
  render() {
    return h('img', {
      src: this.src,
      onMousedown: (event: MouseEvent) => event.preventDefault(),
    });
  },
});

const imageComponentRenderer: BaseRenderer = (_instance, td, _row, _col, _prop, value) => {
  const vnode = h(ImageCell, { src: String(value) });

  render(vnode, td);

  return td;
};

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

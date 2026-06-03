<script setup>
import { ref, h, render, defineComponent } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const ImageCell = defineComponent({
  props: {
    src: { type: String, required: true },
  },
  render() {
    return h('img', {
      src: this.src,
      onMousedown: (event) => event.preventDefault(),
    });
  },
});

function imageComponentRenderer(instance, td, row, col, prop, value) {
  const vnode = h(ImageCell, { src: value });

  render(vnode, td);

  return td;
}

const hotSettings = ref({
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

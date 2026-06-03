<script setup>
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const hotSettings = ref({
  data: [
    ['A1', '/docs/img/examples/professional-javascript-developers-nicholas-zakas.jpg'],
    ['A2', '/docs/img/examples/javascript-the-good-parts.jpg']
  ],
  columns: [
    {},
    {
      renderer(instance, td, row, col, prop, value) {
        const img = document.createElement('img');

        img.src = value;

        img.addEventListener('mousedown', (event) => {
          event.preventDefault();
        });

        td.innerText = '';
        td.appendChild(img);

        return td;
      }
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

<script setup>
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const hotSettings = ref({
  startRows: 5,
  startCols: 5,
  colHeaders: true,
  stretchH: 'all',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
});
const id = ref('my-custom-id');
const className = ref('my-custom-classname');
const style = ref('height: 142px; overflow: hidden; border: 1px solid red;');
</script>

<template>
  <div id="example1">
    <HotTable :id="id" :class="className" :style="style" :settings="hotSettings" />
  </div>
</template>

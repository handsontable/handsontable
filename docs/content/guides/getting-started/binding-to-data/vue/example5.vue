<script setup>
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const hotSettings = ref({
  data: [
    { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
    { id: 2, address: '' },
    { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
  ],
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns: [{ data: 'id' }, { data: 'name.first' }, { data: 'name.last' }, { data: 'address' }],
  minSpareRows: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

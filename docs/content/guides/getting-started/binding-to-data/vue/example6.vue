<script setup>
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const hotSettings = ref({
  data: [],
  dataSchema: {
    id: null,
    name: {
      first: null,
      last: null,
    },
    address: null,
  },
  startRows: 5,
  startCols: 4,
  colHeaders: ['ID', 'First Name', 'Last Name', 'Address'],
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
  <div id="example6">
    <HotTable :settings="hotSettings" />
  </div>
</template>

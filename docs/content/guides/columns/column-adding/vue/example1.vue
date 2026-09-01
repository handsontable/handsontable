<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotSettings = ref<GridSettings>({
  data: [
    ['Ana García', 'Engineering', 'Senior Engineer', '2021-04-12'],
    ['James Okafor', 'Marketing', 'Product Manager', '2022-08-30'],
    ['Li Wei', 'Engineering', 'Staff Engineer', '2019-02-18'],
    ['Sofia Rossi', 'Sales', 'Account Executive', '2023-01-09'],
    ['Diego Fernández', 'Design', 'UX Designer', '2020-11-23'],
    ['Amara Singh', 'Engineering', 'Engineering Manager', '2018-06-05'],
  ],
  colHeaders: ['Name', 'Department', 'Title', 'Hire date'],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function insertColumn() {
  const hot = hotRef.value?.hotInstance;

  // insert one column at the end of the grid
  hot?.alter('insert_col_end', hot.countCols() - 1, 1);
}

function removeColumn() {
  const hot = hotRef.value?.hotInstance;

  // remove the last column, but keep at least one column in the grid
  if (hot && hot.countCols() > 1) {
    hot.alter('remove_col', hot.countCols() - 1, 1);
  }
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" @click="insertColumn">
          Insert column
        </button>
        <button class="button button--primary" @click="removeColumn">
          Remove last column
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const output = ref('Select a cell to see where its values come from.');

const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

const levelOf = (row: number, col: number, key: string) => {
  const hot = hotRef.value!.hotInstance!;

  if (has(hot.getCellMeta(row, col), key)) {
    return 'cell';
  }

  return has(hot.getColumnMeta(col), key) ? 'column' : 'grid';
};

const show = (row: number, col: number) => {
  const hot = hotRef.value?.hotInstance;

  if (!hot || row < 0 || col < 0) {
    return;
  }

  const meta = hot.getCellMeta(row, col);

  output.value = [
    `Cell (${row}, ${col})`,
    `readOnly: ${meta.readOnly} (from the ${levelOf(row, col, 'readOnly')} level)`,
    `reviewer: ${meta.reviewer} (from the ${levelOf(row, col, 'reviewer')} level)`,
  ].join('\n');
};

const setReviewer = () => {
  const hot = hotRef.value?.hotInstance;
  const selected = hot?.getSelectedLast();

  if (!hot || !selected || selected[0] < 0 || selected[1] < 0) {
    output.value = 'Select a cell first.';

    return;
  }

  hot.setCellMeta(selected[0], selected[1], 'reviewer', 'Audit team');
  show(selected[0], selected[1]);
};

const hotSettings: GridSettings = {
  data: [
    ['Ana García', 'Engineering', 'Senior Engineer'],
    ['James Okafor', 'Marketing', 'Product Manager'],
    ['Li Wei', 'Engineering', 'Staff Engineer'],
    ['Priya Nair', 'Finance', 'Financial Analyst'],
    ['Tom Becker', 'Marketing', 'Brand Designer'],
  ],
  colHeaders: ['Name', 'Department', 'Title'],
  rowHeaders: true,
  width: 'auto',
  height: 'auto',
  outsideClickDeselects: false,
  tabNavigation: false,
  // grid level
  readOnly: false,
  reviewer: 'HR team',
  // column level: the Department column
  columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
  // cell level: one cell in the Department column
  cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
  afterSelection: (row, col) => show(row, col),
  licenseKey: 'non-commercial-and-evaluation',
};
</script>

<template>
  <div id="example1">
    <HotTable ref="hotRef" :settings="hotSettings" />
    <p>
      <button type="button" @click="setReviewer">Give the selected cell its own reviewer</button>
    </p>
    <pre role="status" aria-label="Metadata of the selected cell">{{ output }}</pre>
  </div>
</template>

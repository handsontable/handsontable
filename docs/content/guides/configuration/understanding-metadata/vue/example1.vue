<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const output = ref('Select a cell to see where its values come from.');
const status = ref('');

const has = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

const selectedCell = () => {
  const highlight = hotRef.value?.hotInstance?.getSelectedRangeLast()?.highlight;

  // with `navigableHeaders`, the highlight can sit on a header, which has a negative index
  if (!highlight || highlight.row === null || highlight.col === null || highlight.row < 0 || highlight.col < 0) {
    return null;
  }

  return { row: highlight.row, col: highlight.col };
};

const levelOf = (row: number, col: number, key: string) => {
  const hot = hotRef.value!.hotInstance!;

  if (has(hot.getCellMeta(row, col), key)) {
    return 'cell';
  }

  return has(hot.getColumnMeta(col), key) ? 'column' : 'grid';
};

const show = () => {
  const hot = hotRef.value?.hotInstance;
  const cell = selectedCell();

  if (!hot || !cell) {
    return;
  }

  const { row, col } = cell;
  const meta = hot.getCellMeta(row, col);

  output.value = [
    `Cell (${row}, ${col})`,
    `readOnly: ${meta.readOnly} (from the ${levelOf(row, col, 'readOnly')} level)`,
    `reviewer: ${meta.reviewer} (from the ${levelOf(row, col, 'reviewer')} level)`,
  ].join('\n');
};

const setReviewer = () => {
  const hot = hotRef.value?.hotInstance;
  const cell = selectedCell();

  if (!hot || !cell) {
    status.value = 'Select a cell first.';

    return;
  }

  hot.setCellMeta(cell.row, cell.col, 'reviewer', 'Audit team');
  show();
  status.value = `The reviewer of cell (${cell.row}, ${cell.col}) is now Audit team.`;
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
  // keep the selection when you click the button below the grid
  outsideClickDeselects: false,
  // let the Tab key move the focus out of the grid, to the button
  tabNavigation: false,
  // grid level
  readOnly: false,
  reviewer: 'HR team',
  // column level: the Department column
  columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
  // cell level: one cell in the Department column
  cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
  afterSelection: () => show(),
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};
</script>

<template>
  <div id="example1">
    <HotTable ref="hotRef" :settings="hotSettings" />
    <p>
      <button type="button" @click="setReviewer">Give the selected cell its own reviewer</button>
    </p>
    <p role="status">{{ status }}</p>
    <pre>{{ output }}</pre>
  </div>
</template>

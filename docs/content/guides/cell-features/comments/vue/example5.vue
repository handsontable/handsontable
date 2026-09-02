<script setup lang="ts">
import Handsontable from 'handsontable/base';
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Wireless mouse', 142],
    ['USB-C cable', 67],
    ['Mechanical keyboard', -5],
    ['Laptop stand', 38],
    ['HDMI adapter', 210],
  ],
  colHeaders: ['Product', 'Stock'],
  rowHeaders: true,
  comments: true,
  columns: [
    {},
    {
      type: 'numeric',
      validator(value: any, callback: (valid: boolean) => void) {
        callback(Number.isInteger(value) && value >= 0);
      },
    },
  ],
  // Attach a comment when a cell fails validation, and remove it once the cell is valid.
  afterValidate(this: Handsontable, isValid: boolean, value: any, row: number, prop: string | number) {
    const column = this.propToCol(prop);

    // Skip a property that names no column.
    if (column === null) {
      return;
    }

    const comments = this.getPlugin('comments');

    if (!isValid) {
      comments.setCommentAtCell(row, column, `"${value}" is not valid. Enter a whole number of 0 or more.`);
    } else {
      comments.removeCommentAtCell(row, column);
    }
  },
  // Validate every cell on load so the pre-existing invalid value is flagged right away.
  afterInit(this: Handsontable) {
    this.validateCells();
  },
  height: 'auto',
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

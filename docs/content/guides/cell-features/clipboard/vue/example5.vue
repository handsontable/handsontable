<script setup lang="ts">
import Handsontable from 'handsontable/base';
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

type CopyRange = { startRow: number; startCol: number; endRow: number; endCol: number };

registerAllModules();

const copiedComments = ref<(string | undefined)[][]>([]);

function collectComments(hot: Handsontable, coords: CopyRange[]): (string | undefined)[][] {
  const source = coords[0];
  const comments = hot.getPlugin('comments');
  const copied: (string | undefined)[][] = [];

  if (!source) {
    return copied;
  }

  for (let row = source.startRow; row <= source.endRow; row += 1) {
    const rowComments: (string | undefined)[] = [];

    for (let col = source.startCol; col <= source.endCol; col += 1) {
      rowComments.push(comments.getCommentAtCell(row, col));
    }

    copied.push(rowComments);
  }

  return copied;
}

const hotSettings = ref<GridSettings>({
  data: [
    ['Wireless mouse', 142, 'In stock'],
    ['USB-C cable', 67, 'In stock'],
    ['Mechanical keyboard', 0, 'Backordered'],
    ['Laptop stand', 38, 'In stock'],
    ['HDMI adapter', 210, 'In stock'],
  ],
  colHeaders: ['Product', 'Stock', 'Status'],
  rowHeaders: true,
  comments: true,
  cell: [
    { row: 0, col: 1, comment: { value: 'Counted during the July audit.' } },
    { row: 2, col: 1, comment: { value: 'Reorder request sent to Harbor Goods.' } },
    { row: 2, col: 2, comment: { value: 'Expected delivery is July 18.' } },
  ],
  afterCopy(this: Handsontable, _data, coords) {
    copiedComments.value = collectComments(this, coords as CopyRange[]);
  },
  afterCut(this: Handsontable, _data, coords) {
    copiedComments.value = collectComments(this, coords as CopyRange[]);
  },
  afterPaste(this: Handsontable, _data, coords) {
    const target = (coords as CopyRange[])[0];
    const comments = this.getPlugin('comments');

    if (!target) {
      return;
    }

    this.batch(() => {
      copiedComments.value.forEach((rowComments, rowOffset) => {
        rowComments.forEach((comment, colOffset) => {
          const row = target.startRow + rowOffset;
          const col = target.startCol + colOffset;

          if (comment) {
            comments.setCommentAtCell(row, col, comment);
          } else {
            comments.removeCommentAtCell(row, col, false);
          }
        });
      });
    });

    this.render();
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

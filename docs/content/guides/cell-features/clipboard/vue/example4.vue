<script setup lang="ts">
import Handsontable from 'handsontable/base';
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

type CopyRange = { startRow: number; startCol: number; endRow: number; endCol: number };

registerAllModules();

const copiedClassNames = ref<string[][]>([]);

function collectClassNames(hot: Handsontable, coords: CopyRange[]): string[][] {
  const source = coords[0];
  const classNames: string[][] = [];

  if (!source) {
    return classNames;
  }

  for (let row = source.startRow; row <= source.endRow; row += 1) {
    const rowClassNames: string[] = [];

    for (let col = source.startCol; col <= source.endCol; col += 1) {
      rowClassNames.push((hot.getCellMeta(row, col).className as string | undefined) ?? '');
    }

    classNames.push(rowClassNames);
  }

  return classNames;
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
  cell: [
    { row: 0, col: 1, className: 'htRight' },
    { row: 0, col: 2, className: 'htCenter' },
    { row: 2, col: 1, className: 'htRight htDimmed' },
    { row: 2, col: 2, className: 'htCenter htDimmed' },
  ],
  afterCopy(this: Handsontable, _data, coords) {
    copiedClassNames.value = collectClassNames(this, coords as CopyRange[]);
  },
  afterPaste(this: Handsontable, _data, coords) {
    const target = (coords as CopyRange[])[0];

    if (!target) {
      return;
    }

    this.batch(() => {
      copiedClassNames.value.forEach((rowClassNames, rowOffset) => {
        rowClassNames.forEach((className, colOffset) => {
          this.setCellMeta(target.startRow + rowOffset, target.startCol + colOffset, 'className', className);
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
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

type RowObject = {
  value?: number | null;
  __children?: RowObject[];
};

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    {
      value: null,
      __children: [{ value: 5 }, { value: 6 }, { value: 7 }],
    },
    {
      __children: [{ value: 15 }, { value: 16 }, { value: 17 }],
    },
  ] as RowObject[],
  columns: [{ data: 'value' }],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['sum', 'min', 'max', 'count', 'average'],
  columnSummary: function () {
    const endpoints = [];
    const nestedRowsPlugin = this.hot.getPlugin('nestedRows');
    const resultColumn = 0;

    if (!nestedRowsPlugin.isEnabled()) {
      return [];
    }

    for (let visualRow = 0; visualRow < this.hot.countRows(); visualRow++) {
      // Only summarize the top-level parents.
      if (nestedRowsPlugin.getRowLevel(visualRow) !== 0 || !nestedRowsPlugin.isParent(visualRow)) {
        continue;
      }

      const parentRow = this.hot.toPhysicalRow(visualRow);
      const descendantCount = nestedRowsPlugin.countChildren(visualRow, true);

      // A parent's descendants sit in one block right after it in the source data, so the
      // whole subtree is a single range. Count them recursively - the direct child count
      // would stop short whenever a child has children of its own.
      endpoints.push({
        destinationColumn: resultColumn,
        destinationRow: parentRow,
        type: 'sum',
        forceNumeric: true,
        ranges: [[parentRow + 1, parentRow + descendantCount]],
      });
    }

    return endpoints;
  },
  height: 'auto',
});
</script>

<template>
  <div id="example8">
    <HotTable :settings="hotSettings" />
  </div>
</template>

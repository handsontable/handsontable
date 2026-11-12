<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';

// register Handsontable's modules
registerAllModules();

type RowObject = {
  item: string;
  amount: number | null;
  __children?: RowObject[];
};

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data: [
    {
      item: 'Operations',
      amount: null,
      __children: [
        { item: 'Rent', amount: 4200 },
        { item: 'Utilities', amount: 650 },
        {
          item: 'Payroll',
          amount: null,
          __children: [
            { item: 'Engineering', amount: 18500 },
            { item: 'Design', amount: 7400 },
            { item: 'Support', amount: 5100 },
          ],
        },
      ],
    },
  ] as RowObject[],
  columns: [{ data: 'item' }, { data: 'amount', type: 'numeric' }],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['Budget line', 'Amount (USD)'],
  columnSummary: function () {
    const endpoints: SummaryEndpoint[] = [];
    const nestedRowsPlugin = this.hot.getPlugin('nestedRows');

    for (let visualRow = 0; visualRow < this.hot.countRows(); visualRow++) {
      if (!nestedRowsPlugin.isParent(visualRow)) {
        continue;
      }

      const childLevel = nestedRowsPlugin.getRowLevel(visualRow)! + 1;
      const lastDescendant = visualRow + nestedRowsPlugin.countChildren(visualRow, true);
      const ranges: number[][] = [];

      // Add one range for each direct child, which can be a subtotal row.
      for (let row = visualRow + 1; row <= lastDescendant; row++) {
        if (nestedRowsPlugin.getRowLevel(row) === childLevel) {
          const physicalRow = this.hot.toPhysicalRow(row)!;

          ranges.push([physicalRow, physicalRow]);
        }
      }

      endpoints.push({
        sourceColumn: 1,
        destinationColumn: 1,
        destinationRow: this.hot.toPhysicalRow(visualRow)!,
        type: 'sum',
        ranges,
        includeSummaryResults: true,
      });
    }

    return endpoints;
  },
  height: 'auto',
});
</script>

<template>
  <div id="example13">
    <HotTable :settings="hotSettings" />
  </div>
</template>

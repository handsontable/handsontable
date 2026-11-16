<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';

// register Handsontable's modules
registerAllModules();

interface BudgetLine {
  item: string;
  amount: number | null;
  __children?: BudgetLine[];
}

const data: BudgetLine[] = [
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
];

// Give every parent a summary of its direct children. Physical rows follow the data tree,
// so the endpoints stay right while a group is collapsed. Returns the rows `line` spans.
const addEndpoints = (endpoints: SummaryEndpoint[], line: BudgetLine, physicalRow: number): number => {
  const ranges: number[][] = [];
  let nextRow = physicalRow + 1;

  (line.__children ?? []).forEach((child) => {
    ranges.push([nextRow, nextRow]);
    nextRow += addEndpoints(endpoints, child, nextRow);
  });

  if (ranges.length > 0) {
    endpoints.push({
      sourceColumn: 1,
      destinationColumn: 1,
      destinationRow: physicalRow,
      type: 'sum',
      ranges,
      includeSummaryResults: true,
    });
  }

  return nextRow - physicalRow;
};

const hotSettings = ref<GridSettings>({
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data,
  columns: [{ data: 'item' }, { data: 'amount', type: 'numeric' }],
  nestedRows: true,
  rowHeaders: true,
  colHeaders: ['Budget line', 'Amount (USD)'],
  columnSummary() {
    const endpoints: SummaryEndpoint[] = [];
    let physicalRow = 0;

    data.forEach((line) => {
      physicalRow += addEndpoints(endpoints, line, physicalRow);
    });

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

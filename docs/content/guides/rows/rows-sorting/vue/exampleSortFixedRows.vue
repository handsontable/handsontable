<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

// The first row holds a target and the last one a total. Both are frozen, so they stay in
// view while you scroll.
const getData = () => [
  ['Target', 30000, 225],
  ['North', 42300, 318],
  ['South', 18750, 142],
  ['East', 27900, 205],
  ['West', 35100, 264],
  ['Total', 124050, 929],
];

// Builds one grid's settings. Only `sortFixedRows` differs between the two grids.
const createSettings = (sortFixedRows: boolean): GridSettings => ({
  data: getData(),
  colHeaders: ['Region', 'Revenue', 'Orders'],
  columns: [
    { type: 'text' },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
      },
    },
    { type: 'numeric' },
  ],
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  columnSorting: {
    // `false` is the default: the frozen rows keep their place whatever you sort by.
    sortFixedRows,
    // Both grids start sorted by revenue, highest first.
    initialConfig: { column: 1, sortOrder: 'desc' },
  },
  height: 'auto',
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',
});

const defaultSettings = createSettings(false);
const allRowsSettings = createSettings(true);
</script>

<template>
  <div id="exampleSortFixedRows">
    <h3 class="demo-preview">Default: the frozen rows keep their place</h3>
    <HotTable :settings="defaultSettings" />
    <h3 class="demo-preview">With <code>sortFixedRows: true</code>: the frozen rows are sorted too</h3>
    <HotTable :settings="allRowsSettings" />
  </div>
</template>

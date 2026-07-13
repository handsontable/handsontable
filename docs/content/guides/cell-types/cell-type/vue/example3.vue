<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { CellMeta, GridSettings } from 'handsontable/settings';

registerAllModules();
const projectMembers = [
  ['Ana García', 'Product Manager'], ['James Okafor', 'Senior Engineer'], ['Li Wei', 'UX Designer'],
];
const valueCellMeta: CellMeta[] = [
  { type: 'dropdown', source: ['Planning', 'In progress', 'Blocked'] },
  {
    type: 'numeric',
    locale: 'en-US',
    numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  },
  { type: 'intl-date', locale: 'en-US', dateFormat: { year: 'numeric', month: 'short', day: 'numeric' } },
  { type: 'checkbox' },
  { type: 'text' },
  {
    type: 'handsontable',
    handsontable: {
      colHeaders: ['Name', 'Role'],
      autoColumnSize: true,
      data: projectMembers,
      getValue() {
        const selection = this.getSelectedLast();

        return this.getSourceDataAtCell(Math.max(selection?.[0] ?? 0, 0), 0);
      },
    },
  },
  { type: 'password' },
];
const hotSettings: GridSettings = {
  data: [
    ['Status', 'In progress'],
    ['Budget', 250000],
    ['Due date', '2026-09-30'],
    ['Approved', true],
    ['Project name', 'Website redesign'],
    ['Owner', 'Ana García'],
    ['Access code', 'release-2026'],
  ],
  colHeaders: ['Setting', 'Value'],
  columns: [{ readOnly: true }, {}],
  cells: (row, col) => (col === 1 ? (valueCellMeta[row] ?? {}) : {}),
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>

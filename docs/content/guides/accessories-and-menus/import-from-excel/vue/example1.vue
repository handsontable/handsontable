<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotData = [
  ['Ana García', 'Engineering', 'Senior Engineer', 98000, true, '2022-03-14'],
  ['James Okafor', 'Marketing', 'Marketing Manager', 87500, true, '2021-07-01'],
  ['Li Wei', 'Engineering', 'Product Manager', 104000, false, '2020-11-23'],
  ['Priya Nair', 'Sales', 'Account Executive', 76200, true, '2023-01-09'],
  ['Tom Bakker', 'Support', 'Support Specialist', 58900, true, '2019-05-30'],
];

const hotSettings = ref<GridSettings>({
  data: hotData,
  colHeaders: ['Name', 'Department', 'Job title', 'Salary ($)', 'Active', 'Hire date'],
  columns: [
    { type: 'text' },
    { type: 'dropdown', source: ['Engineering', 'Marketing', 'Sales', 'Support'] },
    { type: 'text' },
    { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
    { type: 'checkbox' },
    { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  importFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
});

async function importFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const importPlugin = hotRef.value?.hotInstance?.getPlugin('importFile');
  const result = await importPlugin?.importFromBlob('xlsx', file, {
    colHeaders: 'firstRow',
  });

  console.log('Dropped features:', result?.dropped);

  input.value = '';
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <label for="import-file">Import XLSX</label>
        <input type="file" id="import-file" accept=".xlsx" @change="importFile">
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

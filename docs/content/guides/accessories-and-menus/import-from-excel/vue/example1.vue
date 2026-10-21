<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const SAMPLE_URL = '/docs/scripts/xlsx/employees.xlsx';

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const status = ref('');

const hotData = [
  ['Ana García', 'Engineering', 'Senior Engineer', 98000, true, '2022-03-14'],
  ['James Okafor', 'Marketing', 'Marketing Manager', 87500, true, '2021-07-01'],
  ['Li Wei', 'Engineering', 'Product Manager', 104000, false, '2020-11-23'],
  ['Priya Nair', 'Sales', 'Account Executive', 76200, true, '2023-01-09'],
  ['Tom Bakker', 'Support', 'Support Specialist', 58900, true, '2019-05-30'],
];

// `hotSettings` stays one stable `ref` that nothing changes after an import. A new settings object,
// or a change to one of its keys, makes the wrapper send `colHeaders` and `columns` to
// `updateSettings` again, which puts the sample headers and column types over the imported rows.
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
  formulas: { engine: HyperFormula },
  comments: true,
  mergeCells: true,
  hiddenColumns: true,
  customBorders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  importFile: true,
  licenseKey: 'non-commercial-and-evaluation',
});

async function importWorkbook(blob: Blob, name: string): Promise<void> {
  const importPlugin = hotRef.value?.hotInstance?.getPlugin('importFile');

  if (!importPlugin) {
    status.value = 'The grid is not ready.';

    return;
  }

  try {
    const result = await importPlugin.importFromBlob('xlsx', blob, {
      colHeaders: 'firstRow',
      importStyles: true,
    });

    status.value = `Imported ${name}`;
    console.log('Dropped features:', result.dropped);
  } catch (error) {
    // A refused file (an .xls, a password-protected or damaged workbook) rejects with a message
    // that says what to do; the grid keeps its data.
    status.value = (error as Error).message;
  }
}

async function loadSample(): Promise<void> {
  const response = await fetch(SAMPLE_URL);

  await importWorkbook(await response.blob(), 'employees.xlsx');
}

async function importFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    await importWorkbook(file, file.name);
  }

  // Cleared either way, so picking the same file again fires `change` again.
  input.value = '';
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button @click="loadSample">Load sample</button>
        <label for="import-file">Import XLSX</label>
        <input type="file" id="import-file" accept=".xlsx" @change="importFile">
        <output role="status">{{ status }}</output>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

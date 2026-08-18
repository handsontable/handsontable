<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');

const hotSettings: GridSettings = {
  data: [
    ['Ana García',     'Engineering', 'Senior Engineer',  95000, 'Madrid',      12],
    ['James Okafor',   'Marketing',   'Product Manager',  88000, 'Lagos',        8],
    ['Li Wei',         'Engineering', 'Frontend Dev',     82000, 'Shanghai',     5],
    ['Maria Santos',   'HR',          'HR Specialist',    71000, 'Lisbon',       3],
    ['David Kim',      'Engineering', 'Backend Dev',      85000, 'Seoul',        7],
    ['Emma Wilson',    'Marketing',   'SEO Analyst',      68000, 'London',       2],
    ['Ahmed Hassan',   'Finance',     'Controller',       92000, 'Cairo',       10],
    ['Sara Johansson', 'Engineering', 'QA Engineer',      78000, 'Stockholm',    6],
  ],
  colHeaders: ['Name', 'Department', 'Role', 'Salary', 'City', 'Tenure'],
  rowHeaders: true,
  width: 'auto',
  height: 'auto',
  selectionHandles: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};

onMounted(() => {
  // Pre-select an interior range so the handles are immediately visible.
  hotTableRef.value?.hotInstance?.selectCell(1, 1, 4, 3);
});
</script>

<template>
  <div id="example7">
    <HotTable ref="hotTableRef" :settings="hotSettings" />
  </div>
</template>

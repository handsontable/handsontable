<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    ['Ana García', 'Engineering', 'Senior Engineer', 95000, '2026-03-14'],
    ['James Okafor', 'Marketing', 'Product Manager', 88000, '2026-07-01'],
    ['Li Wei', 'Engineering', 'Frontend Dev', 82000, '2026-01-10'],
    ['Maria Santos', 'HR', 'HR Specialist', 71000, '2026-11-20'],
    ['David Kim', 'Engineering', 'Backend Dev', 85000, '2026-08-05'],
    ['Emma Wilson', 'Marketing', 'SEO Analyst', 68000, '2026-02-14'],
    ['Ahmed Hassan', 'Finance', 'Controller', 92000, '2026-06-30'],
    ['Sara Johansson', 'Engineering', 'QA Engineer', 78000, '2026-09-12'],
    ['Carlos Mendez', 'Sales', 'Account Manager', 74000, '2026-04-25'],
  ],
  rowHeaders: true,
  colHeaders: true,
  stretchH: 'all',
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example">
    <HotTable :settings="hotSettings" />
  </div>
</template>

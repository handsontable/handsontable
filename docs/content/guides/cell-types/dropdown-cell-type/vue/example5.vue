<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const jobTitles = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Engineering Manager',
  'Product Manager',
  'Product Designer',
  'Data Analyst',
  'Data Scientist',
  'Marketing Specialist',
  'Account Executive',
  'Customer Success Manager',
  'Finance Analyst',
  'Recruiter',
  'Office Manager',
];

const hotSettings = ref<GridSettings>({
  height: 'auto',
  data: [
    ['Ana García', 'Senior Software Engineer', 'Senior Software Engineer'],
    ['James Okafor', 'Product Manager', 'Product Manager'],
    ['Li Wei', 'Data Scientist', 'Data Scientist'],
    ['Sofia Rossi', 'Account Executive', 'Account Executive'],
  ],
  colHeaders: ['Employee', 'Job title (default)', 'Job title (compact)'],
  columns: [
    {},
    {
      type: 'dropdown',
      source: jobTitles,
    },
    {
      type: 'dropdown',
      source: jobTitles,
      // show 3 options at a time, then scroll
      visibleRows: 3,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

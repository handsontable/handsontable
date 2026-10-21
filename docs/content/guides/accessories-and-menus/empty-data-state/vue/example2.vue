<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotSettings = ref<GridSettings>({
  data: [],
  height: 'auto',
  colHeaders: ['Name', 'Job title', 'Department', 'City'],
  rowHeaders: true,
  navigableHeaders: true,
  dropdownMenu: true,
  filters: true,
  emptyDataState: {
    message: {
      title: 'No data available',
      description: 'Please add some data to get started.',
      buttons: [
        {
          text: 'Load employees',
          type: 'primary',
          callback: () => {
            hotRef.value?.hotInstance?.loadData([
              ['Ana García', 'Senior Engineer', 'Engineering', 'Austin'],
              ['James Okafor', 'Product Manager', 'Product', 'Chicago'],
              ['Li Wei', 'Data Analyst', 'Analytics', 'Seattle'],
              ['Priya Raman', 'Marketing Lead', 'Marketing', 'Denver'],
              ['Marcus Johnson', 'HR Business Partner', 'People Operations', 'Atlanta'],
            ]);
          },
        },
      ],
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

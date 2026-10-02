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
  contextMenu: true,
  emptyDataState: {
    message: (source) => {
      switch (source) {
        case 'filters':
          return {
            title: 'No results found',
            description: 'Your current filters are hiding all results. Try adjusting your search criteria.',
            buttons: [
              {
                text: 'Clear Filters',
                type: 'secondary',
                callback: () => {
                  const filtersPlugin = hotRef.value?.hotInstance?.getPlugin('filters');

                  if (filtersPlugin) {
                    filtersPlugin.clearConditions();
                    filtersPlugin.filter();
                  }
                },
              },
            ],
          };
        default:
          return {
            title: 'No data available',
            description: "There's nothing to display yet. Add some data to get started.",
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
          };
      }
    },
  },
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

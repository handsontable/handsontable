<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);

const hotSettings = ref<GridSettings>({
  data: [],
  height: 'auto',
  colHeaders: ['First Name', 'Last Name', 'Email'],
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
                text: 'Add Sample Data',
                type: 'primary',
                callback: () => {
                  hotRef.value?.hotInstance?.loadData([
                    ['John', 'Doe', 'john@example.com'],
                    ['Jane', 'Smith', 'jane@example.com'],
                    ['Bob', 'Johnson', 'bob@example.com'],
                    ['Alice', 'Johnson', 'alice@example.com'],
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

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
  emptyDataState: {
    message: {
      title: 'No data available',
      description: 'Please add some data to get started.',
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

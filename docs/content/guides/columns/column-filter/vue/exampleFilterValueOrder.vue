<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

// the order you want in the "Filter by value" list, most severe first
const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
const sizeOrder = ['XS', 'S', 'M', 'L', 'XL'];

// turns an ordered list into a comparator; values the list does not know go last
const orderBy = (order: string[]) => (a: unknown, b: unknown): number => {
  const rank = (value: unknown) =>
    order.indexOf(value as string) === -1 ? order.length : order.indexOf(value as string);

  return rank(a) - rank(b);
};

const hotSettings = ref<GridSettings>({
  data: [
    { task: 'Fix login timeout', priority: 'High', size: 'M' },
    { task: 'Update privacy page', priority: 'Low', size: 'XS' },
    { task: 'Database failover', priority: 'Critical', size: 'XL' },
    { task: 'Refresh icons', priority: 'Medium', size: 'S' },
    { task: 'Rotate API keys', priority: 'High', size: 'L' },
    { task: 'Archive old reports', priority: '', size: 'S' },
  ],
  columns: [
    { title: 'Task', data: 'task', type: 'text' },
    {
      title: 'Priority',
      data: 'priority',
      type: 'text',
      // order this column's filter list by severity rather than alphabetically
      filterValueComparator: orderBy(priorityOrder),
    },
    {
      title: 'Size',
      data: 'size',
      type: 'text',
      filterValueComparator: orderBy(sizeOrder),
    },
  ],
  filters: true,
  dropdownMenu: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="exampleFilterValueOrder">
    <HotTable :settings="hotSettings" />
  </div>
</template>

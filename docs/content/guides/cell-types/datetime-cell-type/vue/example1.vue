<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register all of Handsontable's modules
registerAllModules();

const data = [
  { task: 'Design review', assignee: 'Ana García', deadline: '2024-03-15T09:30:00', created: '2024-03-01T08:00:00', status: 'In progress' },
  { task: 'Sprint demo', assignee: 'James Okafor', deadline: '2024-03-16 14:00:00', created: '2024-03-02T11:20:00', status: 'Scheduled' },
  { task: 'Release', assignee: 'Li Wei', deadline: '2024-03-20T23:59:59', created: '2024-03-05T16:45:00', status: 'Blocked' },
  { task: 'Retro', assignee: 'Sofia Rossi', deadline: '2024-03-22', created: '2024-03-06T09:00:00', status: 'Planned' },
  { task: 'Planning', assignee: 'Noah Cohen', deadline: '2024-03-25T10:15:00', created: '2024-03-08T13:30:00', status: 'In progress' },
];

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Task', 'Assignee', 'Deadline', 'Created', 'Status'],
  columns: [
    { type: 'text', data: 'task', className: 'htLeft' },
    { type: 'text', data: 'assignee', className: 'htLeft' },
    {
      type: 'intl-datetime',
      data: 'deadline',
      className: 'htLeft',
      width: 165,
      locale: 'en-US',
      dateTimeFormat: { dateStyle: 'medium', timeStyle: 'short' },
    },
    {
      type: 'intl-datetime',
      data: 'created',
      className: 'htLeft',
      width: 165,
      locale: 'en-US',
      dateTimeFormat: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      },
    },
    { type: 'text', data: 'status', className: 'htLeft' },
  ],
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  stretchH: 'all',
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

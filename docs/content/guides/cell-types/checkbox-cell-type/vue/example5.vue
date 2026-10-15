<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotSettings = ref<GridSettings>({
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    { task: 'Update API docs', assignee: 'Ana García', done: true },
    { task: 'Deploy hotfix', assignee: 'James Okafor', done: false },
    { task: 'Review pull request', assignee: 'Li Wei', done: true },
    { task: 'Plan sprint', assignee: 'Ana García', done: false },
    { task: 'Fix login bug', assignee: 'James Okafor', done: false },
    { task: 'Write release notes', assignee: 'Li Wei', done: false },
  ],
  columns: [
    { data: 'task', title: 'Task' },
    { data: 'assignee', title: 'Assignee' },
    {
      data: 'done',
      title: 'Done',
      type: 'checkbox',
      // add a "check all" checkbox to the column header
      headerCheckbox: true,
    },
  ],
  colHeaders: true,
  rowHeaders: true,
  // reach the header checkboxes with the arrow keys, toggle them with Space
  navigableHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example5">
    <HotTable :settings="hotSettings" />
  </div>
</template>

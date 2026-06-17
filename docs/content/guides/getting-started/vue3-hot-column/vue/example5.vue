<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type TaskRow = {
  name: string;
  assignee: string;
  due: string;
  status: string;
};

const tasks = ref<TaskRow[]>([
  { name: 'Update API docs', assignee: 'Ana García', due: '2025-06-30', status: 'In progress' },
  { name: 'Deploy hotfix', assignee: 'James Okafor', due: '2025-06-18', status: 'Blocked' },
  { name: 'Review pull request', assignee: 'Li Wei', due: '2025-06-21', status: 'In progress' },
]);

const allColumns = [
  { data: 'name', title: 'Task' },
  { data: 'assignee', title: 'Assignee' },
  { data: 'due', title: 'Due date' },
  { data: 'status', title: 'Status' },
];

const columns = ref([...allColumns.slice(0, 2)]);

const settings = ref<GridSettings>({
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

const addColumn = () => {
  const next = allColumns[columns.value.length];

  if (next) {
    columns.value.push(next);
  }
};

const removeColumn = () => {
  if (columns.value.length > 1) {
    columns.value.pop();
  }
};
</script>

<template>
  <div id="example5">
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" class="button button--primary"
                :disabled="columns.length >= allColumns.length" @click="addColumn">
          Add column
        </button>
        <button type="button" class="button button--primary"
                :disabled="columns.length <= 1" @click="removeColumn">
          Remove column
        </button>
      </div>
    </div>
    <HotTable :data="tasks" :settings="settings">
      <HotColumn v-for="column in columns" :key="column.data" :data="column.data" :title="column.title" />
    </HotTable>
  </div>
</template>

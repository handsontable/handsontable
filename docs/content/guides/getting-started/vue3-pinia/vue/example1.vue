<script setup lang="ts">
import { ref, watch, onMounted, useTemplateRef } from 'vue';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

// Activate Pinia without a Vue app instance (required in the docs example runner).
setActivePinia(createPinia());

type Employee = {
  name: string;
  department: string;
  title: string;
  salary: number;
  startDate: string;
};

const useEmployeeStore = defineStore('employees', {
  state: () => ({
    readOnly: false,
    employees: [
      { name: 'Ana García',    department: 'Engineering',  title: 'Senior Engineer',   salary: 95000, startDate: '2021-03-14' },
      { name: 'James Okafor', department: 'Marketing',    title: 'Product Manager',   salary: 87000, startDate: '2019-07-22' },
      { name: 'Li Wei',       department: 'Engineering',  title: 'Frontend Engineer', salary: 82000, startDate: '2022-01-10' },
      { name: 'Sara Novak',   department: 'Design',       title: 'UX Designer',       salary: 78000, startDate: '2020-11-05' },
      { name: 'Tom Eriksson', department: 'Sales',        title: 'Account Executive', salary: 74000, startDate: '2023-04-18' },
    ] as Employee[],
  }),
  actions: {
    toggleReadOnly() {
      this.readOnly = !this.readOnly;
    },
    updateEmployee(row: number, col: number, value: string | number) {
      const keys = Object.keys(this.employees[0]) as (keyof Employee)[];
      const key = keys[col];

      if (key && this.employees[row]) {
        (this.employees[row] as Record<string, string | number>)[key] = value;
      }
    },
    resetData() {
      this.employees = [
        { name: 'Ana García',    department: 'Engineering',  title: 'Senior Engineer',   salary: 95000, startDate: '2021-03-14' },
        { name: 'James Okafor', department: 'Marketing',    title: 'Product Manager',   salary: 87000, startDate: '2019-07-22' },
        { name: 'Li Wei',       department: 'Engineering',  title: 'Frontend Engineer', salary: 82000, startDate: '2022-01-10' },
        { name: 'Sara Novak',   department: 'Design',       title: 'UX Designer',       salary: 78000, startDate: '2020-11-05' },
        { name: 'Tom Eriksson', department: 'Sales',        title: 'Account Executive', salary: 74000, startDate: '2023-04-18' },
      ];
    },
  },
});

const store = useEmployeeStore();
const wrapper = useTemplateRef<InstanceType<typeof HotTable>>('wrapper');

const hotSettings = ref<GridSettings>({
  data: store.employees.map(e => Object.values(e)),
  colHeaders: ['Name', 'Department', 'Title', 'Salary', 'Start Date'],
  rowHeaders: true,
  height: 'auto',
  readOnly: store.readOnly,
  autoWrapRow: true,
  autoWrapCol: true,
  afterChange(changes) {
    if (!changes) return;

    for (const [row, col, , newValue] of changes) {
      store.updateEmployee(row as number, col as number, newValue as string | number);
    }
  },
  licenseKey: 'non-commercial-and-evaluation',
});

// Store → grid: watch for store mutations and update the grid.
watch(
  () => store.readOnly,
  (val) => {
    hotSettings.value = { ...hotSettings.value, readOnly: val };
  }
);

watch(
  () => store.employees,
  (val) => {
    hotSettings.value = { ...hotSettings.value, data: val.map(e => Object.values(e)) };
  },
  { deep: true }
);

function updateStorePreview() {
  const pre = document.querySelector('#pinia-preview pre');

  if (!pre) return;

  pre.textContent = JSON.stringify({ readOnly: store.readOnly, employees: store.employees }, null, 2);
}

onMounted(() => {
  store.$subscribe(() => updateStorePreview());
  updateStorePreview();
});
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button v-on:click="store.toggleReadOnly()">
          Toggle <code>readOnly</code> (currently: {{ store.readOnly }})
        </button>
        <button v-on:click="store.resetData()" style="margin-left: 0.5rem">
          Reset data
        </button>
      </div>
    </div>
    <HotTable ref="wrapper" :settings="hotSettings" />
    <div id="pinia-preview">
      <strong>Pinia store dump:</strong>
      <pre></pre>
    </div>
  </div>
</template>

<style>
#pinia-preview {
  margin-top: 0.75rem;
}

#pinia-preview strong {
  display: block;
  margin-bottom: 0.375rem;
  color: var(--sl-color-gray-2, #555555);
  font-family: var(--sl-font, Inter, system-ui, -apple-system, sans-serif);
  font-size: var(--sl-text-xs, 0.75rem);
}

#pinia-preview pre {
  height: 168px;
  padding: 0.5rem 0.75rem;
  overflow-y: auto;
  font-size: var(--sl-text-xs, 0.75rem);
  font-family: var(--sl-font-mono, ui-monospace, monospace);
  line-height: 1.6;
  border: 1px solid var(--sl-color-gray-5, #e0e0e0);
  background: var(--sl-color-gray-7, #f5f5f5);
  color: var(--sl-color-gray-2, #555555);
  margin: 0;
  border-radius: 0;
}
</style>

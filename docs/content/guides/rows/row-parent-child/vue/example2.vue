<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

type TaskRow = {
  task: string;
  owner: string;
  status: string;
  __children?: TaskRow[];
};

const projectPlan: TaskRow[] = [
  {
    task: 'Marketing',
    owner: 'Dana',
    status: 'In progress',
    __children: [
      {
        task: 'Website refresh',
        owner: 'Ivy',
        status: 'In progress',
        __children: [
          { task: 'Copywriting', owner: 'Leo', status: 'Done' },
          { task: 'Visual design', owner: 'Mia', status: 'In review' },
        ],
      },
      { task: 'Ad campaign', owner: 'Nico', status: 'Planned' },
    ],
  },
  {
    task: 'Engineering',
    owner: 'Sam',
    status: 'In progress',
    __children: [
      {
        task: 'API v2',
        owner: 'Ravi',
        status: 'In progress',
        __children: [{ task: 'Auth endpoints', owner: 'Tess', status: 'Done' }],
      },
      { task: 'Bug triage', owner: 'Kai', status: 'Planned' },
    ],
  },
];

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const output = ref('Click a button to call a method.');

// A plain const, so a status change beside the grid never triggers `updateSettings()`.
const hotSettings: GridSettings = {
  data: projectPlan,
  columns: [{ data: 'task' }, { data: 'owner' }, { data: 'status' }],
  colHeaders: ['Task', 'Owner', 'Status'],
  rowHeaders: true,
  nestedRows: true,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
};

const getPlugin = () => hotRef.value?.hotInstance?.getPlugin('nestedRows');
const countRows = () => hotRef.value?.hotInstance?.countRows();

const collapseAll = () => {
  getPlugin()?.collapseAll();
  output.value = `collapseAll() -> ${countRows()} rows are visible now`;
};

const expandAll = () => {
  getPlugin()?.expandAll();
  output.value = `expandAll() -> ${countRows()} rows are visible now`;
};

// `toggleParent` takes a visual row index and returns `true` when the state changed.
const toggleFirst = () => {
  const plugin = getPlugin();
  const changed = plugin?.toggleParent(0);

  output.value = `toggleParent(0) -> ${changed}, collapsed: ${plugin?.isParentCollapsed(0)}`;
};

// `getCollapsedParents` returns physical row indexes, because a parent collapsed inside another
// collapsed parent has no visual index at all.
const readState = () => {
  const plugin = getPlugin();

  output.value =
    `getCollapsedParents() -> [${plugin?.getCollapsedParents()}]\n` +
    `getRowLevel(0) -> ${plugin?.getRowLevel(0)}\n` +
    `countChildren(0) -> ${plugin?.countChildren(0)}`;
};
</script>

<template>
  <div id="example2">
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" @click="collapseAll">collapseAll()</button>
        <button class="button button--primary" @click="expandAll">expandAll()</button>
        <button class="button button--primary" @click="toggleFirst">toggleParent(0)</button>
        <button class="button button--primary" @click="readState">Read the state</button>
      </div>
      <output class="console">{{ output }}</output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

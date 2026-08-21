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

// Physical row indexes follow the source data, depth first. Walk the tree once to map every task
// name to its physical row - that is the index `expandToRow` needs.
const physicalRowOf = new Map<string, number>();

let physicalRow = 0;

(function walk(rows: TaskRow[]) {
  rows.forEach((row) => {
    physicalRowOf.set(row.task, physicalRow);
    physicalRow += 1;
    walk(row.__children ?? []);
  });
})(projectPlan);

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const output = ref('Everything starts collapsed. Pick a task to jump to.');

const hotSettings: GridSettings = {
  data: projectPlan,
  columns: [{ data: 'task' }, { data: 'owner' }, { data: 'status' }],
  colHeaders: ['Task', 'Owner', 'Status'],
  rowHeaders: true,
  nestedRows: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  afterInit() {
    this.getPlugin('nestedRows').collapseAll();
  },
};

// Reveals a task that is currently hidden inside collapsed parents, then selects it.
const revealTask = (taskName: string) => {
  const hot = hotRef.value?.hotInstance;

  if (!hot) {
    return;
  }

  const plugin = hot.getPlugin('nestedRows');
  const row = physicalRowOf.get(taskName)!;
  const wasHidden = hot.toVisualRow(row) === null;

  // `expandToRow` takes a PHYSICAL index, because a hidden row has no visual index yet.
  plugin.expandToRow(row);

  const visualRow = hot.toVisualRow(row)!;

  hot.selectCell(visualRow, 0);

  output.value =
    `"${taskName}" was ${wasHidden ? 'hidden' : 'already visible'}.\n` +
    `physical row ${row} -> visual row ${visualRow}, nesting level ${plugin.getRowLevel(visualRow)}`;
};

const collapseEverything = () => {
  const hot = hotRef.value?.hotInstance;

  hot?.getPlugin('nestedRows').collapseAll();
  output.value = `Collapsed again - ${hot?.countRows()} rows are visible.`;
};
</script>

<template>
  <div id="example3">
    <div class="example-controls-container">
      <div class="controls">
        <button class="button button--primary" @click="revealTask('Auth endpoints')">
          Find "Auth endpoints"
        </button>
        <button class="button button--primary" @click="revealTask('Visual design')">
          Find "Visual design"
        </button>
        <button class="button button--primary" @click="collapseEverything">
          Collapse everything
        </button>
      </div>
      <output class="console">{{ output }}</output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

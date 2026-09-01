<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotTableRef = useTemplateRef<InstanceType<typeof HotTable>>('hotTableRef');
const output = ref('');

const hotSettings = ref<GridSettings>({
  data: [
    ['Update API docs', 'Ana García', 'In progress'],
    ['Deploy hotfix', 'James Okafor', 'Blocked'],
    ['Review pull requests', 'Li Wei', 'Done'],
    ['Plan Q3 roadmap', 'Maria Santos', 'In progress'],
    ['Refactor auth module', 'David Kim', 'In review'],
  ],
  colHeaders: ['Task', 'Assignee', 'Status'],
  rowHeaders: true,
  comments: true,
  cell: [
    { row: 1, col: 2, comment: { value: 'Waiting on infrastructure approval.' } },
    { row: 3, col: 1, comment: { value: 'Reassign if capacity is tight.' } },
    { row: 4, col: 0, comment: { value: 'Blocked on the security review.' } },
  ],
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const listComments = () => {
  const hot = hotTableRef.value?.hotInstance;

  if (!hot) {
    return;
  }

  const found: string[] = [];

  // `getCellMetaAtRow()` takes a physical row index (equal to the visual index here, with no sorting or trimming).
  for (let row = 0; row < hot.countRows(); row += 1) {
    hot.getCellMetaAtRow(row).forEach((cellMeta, col) => {
      const comment = cellMeta.comment as { value?: string } | undefined;

      if (comment?.value !== undefined) {
        found.push(`Row ${row + 1}, "${hot.getColHeader(col)}": ${comment.value}`);
      }
    });
  }

  output.value = found.length > 0 ? found.join('\n') : 'No comments found.';
};
</script>

<template>
  <div id="example6">
    <div class="example-controls-container">
      <div class="controls">
        <button id="list-comments" type="button" @click="listComments">List all comments</button>
      </div>
    </div>
    <HotTable ref="hotTableRef" :settings="hotSettings" />
    <output class="comments-output" style="white-space: pre-wrap">{{ output }}</output>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

// marks a change as coming from another collaborator, so it isn't broadcast again
const REMOTE_SOURCE = 'remotePeer';

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const statusText = ref('A remote update to the first row arrives in 3 seconds.');
let timeoutId: ReturnType<typeof setTimeout>;

const hotSettings = ref<GridSettings>({
  data: [
    ['Update onboarding flow', 'Ana García', 'In progress'],
    ['Fix invoice rounding bug', 'James Okafor', 'Blocked'],
    ['Write Q3 release notes', 'Li Wei', 'In progress'],
    ['Migrate auth service', 'Sofia Rossi', 'Done'],
    ['Design empty states', 'Diego Fernández', 'In progress'],
  ],
  colHeaders: ['Task', 'Assignee', 'Status'],
  rowHeaders: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  beforeChange(changes, source) {
    if (source === REMOTE_SOURCE || !changes) {
      return;
    }

    changes.forEach(([row, column, , newValue]) => {
      // send the local edit to your collaboration backend here
      console.log('Broadcasting local edit:', row, column, newValue);
    });
  },
});

function applyRemoteChange(row: number, column: number, value: string) {
  const hot = hotRef.value?.hotInstance;
  const editor = hot?.getActiveEditor();
  const editingSameCell = editor?.isOpened() && editor.row === row && editor.col === column;

  if (editingSameCell) {
    // don't overwrite a cell the local user is editing right now -
    // check again shortly, and apply the change once the local edit finishes
    timeoutId = setTimeout(() => applyRemoteChange(row, column, value), 300);

    return;
  }

  hot?.setDataAtCell(row, column, value, REMOTE_SOURCE);
  statusText.value = 'A collaborator marked "Update onboarding flow" as Done.';
}

onMounted(() => {
  // simulate an update coming from another collaborator - start editing the Status
  // cell in the first row before the timeout fires to see the update wait for you
  timeoutId = setTimeout(() => applyRemoteChange(0, 2, 'Done'), 3000);
});

onBeforeUnmount(() => clearTimeout(timeoutId));
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <p class="controls">{{ statusText }}</p>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

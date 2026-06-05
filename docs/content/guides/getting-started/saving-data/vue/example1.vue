<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { CellChange, ChangeSource } from 'handsontable/common';

registerAllModules();

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);
const output = ref('Click "Load" to load data from server');
const isAutosave = ref(false);

function autosaveClickCallback(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;

  isAutosave.value = checked;
  output.value = checked
    ? 'Changes will be autosaved'
    : 'Changes will not be autosaved';
}

function loadClickCallback() {
  const hot = hotRef.value?.hotInstance;

  fetch('/docs/scripts/json/load.json').then((response) => {
    response.json().then((data: { data: unknown[][] }) => {
      hot?.loadData(data.data);
      output.value = 'Data loaded';
    });
  });
}

function saveClickCallback() {
  const hot = hotRef.value?.hotInstance;

  fetch('/docs/scripts/json/save.json', {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: hot?.getData() }),
  }).then(() => {
    output.value = 'Data saved';
    console.log('The POST request is only used here for the demo purposes');
  });
}

function afterChange(change: CellChange[] | null, source: ChangeSource) {
  if (source === 'loadData') {
    return;
  }

  if (!isAutosave.value) {
    return;
  }

  fetch('/docs/scripts/json/save.json', {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: change }),
  }).then(() => {
    output.value = `Autosaved (${change?.length} cell${(change?.length || 0) > 1 ? 's' : ''})`;
    console.log('The POST request is only used here for the demo purposes');
  });
}

const hotSettings = ref<GridSettings>({
  startRows: 8,
  startCols: 6,
  rowHeaders: true,
  colHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  afterChange,
});
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <button id="load" class="button button--primary button--blue" @click="loadClickCallback">
          Load data
        </button>
        <button id="save" class="button button--primary button--blue" @click="saveClickCallback">
          Save data
        </button>
        <label>
          <input
            type="checkbox"
            name="autosave"
            id="autosave"
            :checked="isAutosave"
            @click="autosaveClickCallback"
          />
          Autosave
        </label>
      </div>
      <output class="console" id="output">{{ output }}</output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

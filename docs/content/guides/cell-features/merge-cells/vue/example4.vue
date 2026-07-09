<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const hotSettings: GridSettings = {
  data: [
    ['North America', 420000, 465000, 501000],
    ['Europe', 388000, 402000, 411000],
    ['APAC', 275000, 298000, 312000],
    ['Latin America', 142000, 151000, 158000],
    ['Middle East', 96000, 101000, 108000],
    ['Note: Q1 totals include a one-time currency adjustment.', null, null, null],
  ],
  colHeaders: ['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
  rowHeaders: true,
  height: 'auto',
  contextMenu: true,
  mergeCells: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};

function mergeNoteRow() {
  hotRef.value?.hotInstance?.getPlugin('mergeCells').merge(5, 0, 5, 3);
}

function unmergeNoteRow() {
  hotRef.value?.hotInstance?.getPlugin('mergeCells').unmerge(5, 0, 5, 3);
}
</script>

<template>
  <div id="example4">
    <div class="example-controls-container">
      <div class="controls">
        <button id="example4-merge" class="button button--primary" @click="mergeNoteRow">
          Merge the note row
        </button>
        <button id="example4-unmerge" class="button button--primary" @click="unmergeNoteRow">
          Unmerge the note row
        </button>
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

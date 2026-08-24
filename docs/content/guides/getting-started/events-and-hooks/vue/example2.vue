<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { CellChange } from 'handsontable/common';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
let lastChange: CellChange[] | null = null;

onMounted(() => {
  const hot = hotRef.value?.hotInstance;

  hot?.updateSettings({
    beforeKeyDown(e) {
      const selection = hot?.getSelected()?.[0];

      if (!selection) return;
      if (selection[0] < 0 || selection[1] < 0) return;

      // BACKSPACE or DELETE
      if (e.keyCode === 8 || e.keyCode === 46) {
        // remove data at cell, shift up
        hot.spliceCol(selection[1], selection[0], 1);
        e.preventDefault();
        lastChange = null;

        // block the default deletion behavior
        return false;
      }

      // ENTER
      if (e.keyCode === 13) {
        // if last change affected a single cell and did not change its values
        if (lastChange && lastChange.length === 1 && lastChange[0][2] == lastChange[0][3]) {
          hot.spliceCol(selection[1], selection[0], 0, '');
          // add new cell
          hot.selectCell(selection[0], selection[1]);
          lastChange = null;

          // block the default Enter behavior
          return false;
        }
      }

      lastChange = null;
    },
  });
});

const hotSettings = ref<GridSettings>({
  data: [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ],
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  minSpareRows: 1,
  beforeChange(changes) {
    lastChange = changes;
  },
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

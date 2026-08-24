<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { type BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';
import type Handsontable from 'handsontable/base';
import type { GridSettings } from 'handsontable/settings';

// Register all Handsontable's modules.
registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

const templateValues: string[] = ['one', 'two', 'three'];
const data: (string | number)[][] = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
];

function isEmptyRow(instance: Handsontable, row: number) {
  const rowData = instance.getDataAtRow(row);

  for (let i = 0, ilen = rowData.length; i < ilen; i++) {
    if (rowData[i] !== null) {
      return false;
    }
  }

  return true;
}

const defaultValueRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  if (value === null && isEmptyRow(instance, row)) {
    value = templateValues[col];
    td.style.color = '#999';
  } else {
    td.style.color = '';
  }

  textRenderer(instance, td, row, col, prop, value, cellProperties);
};

const hotSettings = ref<GridSettings>({
  data,
  startRows: 8,
  startCols: 5,
  minSpareRows: 1,
  contextMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  cells() {
    return { renderer: defaultValueRenderer };
  },
  beforeChange(changes) {
    const instance = hotRef.value?.hotInstance;

    if (!instance || changes === null) {
      return;
    }

    const columns = instance.countCols();
    const rowColumnSeen: Record<string, boolean> = {};
    const rowsToFill: Record<string, boolean> = {};
    for (let i = 0; i < changes.length; i++) {
      const ch = changes[i] as Handsontable.CellChange;

      // if oldVal is empty
      if (ch[2] === null && ch[3] !== null) {
        if (isEmptyRow(instance, ch[0] as number)) {
          // add this row/col combination to the cache so it will not be overwritten by the template
          rowColumnSeen[`${ch[0]}/${ch[1]}`] = true;
          rowsToFill[String(ch[0])] = true;
        }
      }
    }

    for (const r in rowsToFill) {
      if (rowsToFill.hasOwnProperty(r)) {
        for (let c = 0; c < columns; c++) {
          // if it is not provided by user in this change set, take the value from the template
          if (!rowColumnSeen[`${r}/${c}`]) {
            changes.push([Number(r), c, null, templateValues[c]]);
          }
        }
      }
    }
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
</script>

<template>
  <div id="example3">
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

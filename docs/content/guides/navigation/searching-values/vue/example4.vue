<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');
const resultCount = ref(0);

const data = [
  ['Hydrogen', 'H', 1, 1.008],
  ['Helium', 'He', 2, 4.003],
  ['Lithium', 'Li', 3, 6.94],
  ['Beryllium', 'Be', 4, 9.012],
  ['Boron', 'B', 5, 10.81],
];

function searchResultCounter(
  instance: Handsontable,
  row: number,
  col: number,
  _value: string | number | null,
  testResult: boolean
): void {
  instance.getCellMeta(row, col).isSearchResult = testResult;

  if (testResult) {
    resultCount.value += 1;
  }
}

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  search: {
    callback: searchResultCounter,
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function onSearchKeyUp(event: KeyboardEvent): void {
  const target = event.currentTarget as HTMLInputElement;
  const hot = hotRef.value?.hotInstance;

  resultCount.value = 0;

  const search = hot?.getPlugin('search');
  const queryResult = search?.query(target.value);

  console.log(queryResult);

  hot?.render();
}
</script>

<template>
  <div id="example4">
    <div class="example-controls-container">
      <div class="controls">
        <input
          id="search_field4"
          type="search"
          placeholder="Search"
          @keyup="onSearchKeyUp"
        >
      </div>
      <output class="console" id="output">
        {{ resultCount }} results
      </output>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type Handsontable from 'handsontable/base';

registerAllModules();

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);
const resultCount = ref(0);

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'white', 'gray'],
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
  colHeaders: true,
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

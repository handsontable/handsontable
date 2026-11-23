<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

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

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  search: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});

function onSearchKeyUp(event: KeyboardEvent): void {
  const target = event.currentTarget as HTMLInputElement;
  const hot = hotRef.value?.hotInstance;
  const search = hot?.getPlugin('search');

  if (!search) {
    return;
  }

  // the default callback marks the matching cells, so they stay highlighted
  const defaultCallback = search.getCallback();
  let count = 0;

  // pass your custom callback function: it calls the default callback and counts the matches
  const queryResult = search.query(target.value, (instance, row, col, value, result) => {
    defaultCallback(instance, row, col, value, result);

    if (result) {
      count += 1;
    }
  });

  console.log(queryResult);
  resultCount.value = count;

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
          aria-label="Search"
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

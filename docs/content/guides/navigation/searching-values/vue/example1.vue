<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

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
  licenseKey: 'non-commercial-and-evaluation',
});

function onSearchKeyUp(event: KeyboardEvent): void {
  const target = event.currentTarget as HTMLInputElement;
  const hot = hotRef.value?.hotInstance;
  const search = hot?.getPlugin('search');
  const queryResult = search?.query(target.value);

  console.log(queryResult);

  hot?.render();
}
</script>

<template>
  <div id="example1">
    <div class="example-controls-container">
      <div class="controls">
        <input
          id="search_field"
          type="search"
          placeholder="Search"
          @keyup="onSearchKeyUp"
        >
      </div>
    </div>
    <HotTable ref="hotRef" :settings="hotSettings" />
  </div>
</template>

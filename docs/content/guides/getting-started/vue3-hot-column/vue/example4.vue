<script setup lang="ts">
import { ref } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';

registerAllModules();

const scoreRenderer: BaseRenderer = (_instance, td, _row, _col, _prop, value) => {
  const score = Number(value);

  td.innerHTML = String(value ?? '');
  td.style.color = score >= 80 ? '#2d7d46' : score < 50 ? '#c0392b' : '';
  td.style.fontWeight = score >= 80 ? 'bold' : '';

  return td;
};

const hotData = ref([
  ['Ana García', 92],
  ['James Okafor', 45],
  ['Li Wei', 73],
  ['Sara Müller', 88],
  ['Tom Nakamura', 31],
]);

const settings = ref<GridSettings>({
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example4">
    <HotTable :data="hotData" :settings="settings">
      <HotColumn title="Employee" :read-only="true" />
      <HotColumn title="Score" type="numeric" :renderer="scoreRenderer" />
    </HotTable>
  </div>
</template>

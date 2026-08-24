<script setup lang="ts">
import { ref, h, createApp, defineComponent, inject } from 'vue';
import type { App } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';
import type { BaseRenderer } from 'handsontable/renderers';

registerAllModules();

// A component that reads an injected currency formatter via inject().
// inject() requires a Vue app context -- use createApp() to provide it.
const RevenueCell = defineComponent({
  props: { value: { type: String, default: '' } },
  setup(props) {
    const format = inject<(v: string) => string>('formatRevenue', (v) => v);
    return () => h('span', format(props.value));
  },
});

type TdWithApp = HTMLTableCellElement & { _app?: App };

const revenueRenderer: BaseRenderer = (_instance, td, _row, _col, _prop, value) => {
  const cell = td as TdWithApp;

  // Unmount the previous app on this cell before remounting.
  cell._app?.unmount();

  const app = createApp(RevenueCell, { value: String(value) });
  app.provide('formatRevenue', (v: string) => {
    const num = parseFloat(v);
    return isNaN(num)
      ? v
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  });
  cell._app = app;
  app.mount(td);

  return td;
};

const hotSettings = ref<GridSettings>({
  data: [
    ['Acme Corp', 'Q1 2025', '42000'],
    ['Vertex Industries', 'Q2 2025', '18750.5'],
    ['Harbor Goods', 'Q3 2025', '9200'],
    ['Alpine Supply Co.', 'Q4 2025', '130000'],
    ['Pinnacle Ltd', 'Q1 2026', '67450.25'],
  ],
  colHeaders: ['Company', 'Quarter', 'Revenue'],
  columns: [
    {},
    {},
    { renderer: revenueRenderer },
  ],
  height: 'auto',
  stretchH: 'all',
  autoRowSize: false,
  autoColumnSize: false,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example2">
    <HotTable :settings="hotSettings" />
  </div>
</template>

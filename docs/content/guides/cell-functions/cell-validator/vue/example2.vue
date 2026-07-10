<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

const data = [
  ['Spring Sale 2025', 'Email', '3.4'],
  ['Brand Awareness Q3', 'Paid Search', '8,1'],
  ['Retention Push', 'In-app', '12.0'],
  ['Partner Webinar', 'Organic', '6,75'],
  ['Holiday Preview', 'Social', '9.25'],
];

type CellMeta = { allowEmpty?: boolean };

function decimalValidator(this: CellMeta, value: unknown, callback: (valid: boolean) => void) {
  if (this.allowEmpty && (value === null || value === undefined || value === '')) {
    callback(true);

    return;
  }

  callback(/^\d+[.,]\d+$/.test(String(value)));
}

const hotSettings = ref<GridSettings>({
  data,
  colHeaders: ['Campaign', 'Channel', 'Conversion rate'],
  columns: [
    {},
    {},
    {
      validator: decimalValidator,
      allowInvalid: false,
    },
  ],
  height: 'auto',
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

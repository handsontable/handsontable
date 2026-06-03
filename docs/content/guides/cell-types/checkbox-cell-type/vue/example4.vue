<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    { car: 'Mercedes A 160', year: 2017, comesInBlack: 'yes' },
    { car: 'Citroen C4 Coupe', year: 2018, comesInBlack: 'yes' },
    { car: 'Audi A4 Avant', year: 2019, comesInBlack: 'no' },
    { car: 'Opel Astra', year: 2020, comesInBlack: 'yes' },
    { car: 'BMW 320i Coupe', year: 2021, comesInBlack: 'no' },
  ],
  colHeaders: ['Car model', 'Year', 'Comes in black'],
  height: 'auto',
  columns: [
    {
      data: 'car',
    },
    {
      data: 'year',
    },
    {
      data: 'comesInBlack',
      type: 'checkbox',
      checkedTemplate: 'yes',
      uncheckedTemplate: 'no',
      label: {
        position: 'after',
        value(row: number, column: number, prop: string | number, value: string) {
          if (value === 'yes') {
            return 'In black';
          } else {
            return 'Not in black';
          }
        },
      },
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example4">
    <HotTable :settings="hotSettings" />
  </div>
</template>

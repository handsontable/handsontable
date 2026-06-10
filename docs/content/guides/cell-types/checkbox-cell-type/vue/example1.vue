<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const hotSettings = ref<GridSettings>({
  data: [
    {
      car: 'Mercedes A 160',
      year: 2017,
      available: true,
      comesInBlack: 'yes',
    },
    {
      car: 'Citroen C4 Coupe',
      year: 2018,
      available: false,
      comesInBlack: 'yes',
    },
    {
      car: 'Audi A4 Avant',
      year: 2019,
      available: true,
      comesInBlack: 'no',
    },
    {
      car: 'Opel Astra',
      year: 2020,
      available: false,
      comesInBlack: 'yes',
    },
    {
      car: 'BMW 320i Coupe',
      year: 2021,
      available: false,
      comesInBlack: 'no',
    },
  ],
  colHeaders: ['Car model', 'Year of manufacture', 'Available'],
  height: 'auto',
  columns: [
    {
      data: 'car',
    },
    {
      data: 'year',
      type: 'numeric',
    },
    {
      data: 'available',
      type: 'checkbox',
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example1">
    <HotTable :settings="hotSettings" />
  </div>
</template>

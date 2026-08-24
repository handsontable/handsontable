<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type { GridSettings } from 'handsontable/settings';

// register Handsontable's modules
registerAllModules();

const requiredItems: string[] = ['Passport', 'Tickets', 'Wallet', 'Phone', 'Keys'];
const optionalExtras: string[] = ['Snacks', 'Book', 'Camera', 'Umbrella', 'First aid kit'];
const interests: string[] = ['Art', 'History', 'Nature', 'Food', 'Shopping'];

const sortAlphabetically = (entries: (string | object)[]) =>
  [...entries].sort((a, b) => String(a).localeCompare(String(b)));

const data: string[][][] = [
  [['Passport', 'Phone'], ['Snacks', 'Book'], ['Nature']],
  [['Tickets', 'Wallet'], ['Camera'], []],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
];

const hotSettings = ref<GridSettings>({
  data,
  columns: [
    {
      type: 'multiselect',
      source: requiredItems,
      title: 'Required items',
      allowEmpty: false,
    },
    {
      type: 'multiselect',
      source: optionalExtras,
      title: 'Optional extras',
      placeholder: 'Select up to 3',
      maxSelections: 3,
      visibleRows: 4,
      searchInput: false,
    },
    {
      type: 'multiselect',
      source: interests,
      title: 'Interests',
      placeholder: 'Select interests',
      sourceSortFunction: sortAlphabetically,
      filteringCaseSensitive: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  stretchH: 'last',
  width: '100%',
  licenseKey: 'non-commercial-and-evaluation',
});
</script>

<template>
  <div id="example3">
    <HotTable :settings="hotSettings" />
  </div>
</template>

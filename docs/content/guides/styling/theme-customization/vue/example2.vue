<script setup lang="ts">
import { computed } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { horizonTheme, registerTheme, getTheme } from 'handsontable/themes';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();

registerTheme(horizonTheme);

getTheme('horizon')?.params({
  colors: {
    primary: {
      500: '#9333ea',
    },
  },
  tokens: {
    fontSize: '16px',
    iconSize: 'sizing.size_5',
    accentColor: ['colors.primary.500', 'colors.primary.600'],
  },
});

const hotSettings = computed<GridSettings>(() => ({
  theme: getTheme('horizon')?.setColorScheme('light').setDensityType('default'),
  data: [
    ['John Doe', 'johndoe@example.com', 'New York', 32, 'Engineer'],
    ['Jane Smith', 'janesmith@example.com', 'Los Angeles', 29, 'Designer'],
    ['Sam Wilson', 'samwilson@example.com', 'Chicago', 41, 'Manager'],
    ['Emily Johnson', 'emilyj@example.com', 'San Francisco', 35, 'Developer'],
    ['Michael Brown', 'mbrown@example.com', 'Boston', 38, 'Analyst'],
  ],
  colHeaders: ['Name', 'Email', 'City', 'Age', 'Position'],
  columns: [
    { data: 0, type: 'text' },
    { data: 1, type: 'text' },
    { data: 2, type: 'text' },
    { data: 3, type: 'numeric' },
    { data: 4, type: 'text' },
  ],
  rowHeaders: true,
  dropdownMenu: true,
  width: '100%',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
}));
</script>

<template>
  <div id="example2" class="disable-auto-theme">
    <HotTable :settings="hotSettings" />
  </div>
</template>

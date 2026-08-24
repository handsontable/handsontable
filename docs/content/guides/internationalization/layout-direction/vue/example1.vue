<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';
import type { GridSettings } from 'handsontable/settings';

registerAllModules();
registerLanguageDictionary(arAR);

function generateArabicData(): (string | number | boolean)[][] {
  const randomName = () => ['عمر', 'علي', 'عبد الله', 'معتصم'][Math.floor(Math.random() * 4)];
  const randomCountry = () => ['تركيا', 'مصر', 'لبنان', 'العراق'][Math.floor(Math.random() * 4)];
  const randomDate = () => new Date(Math.floor(Math.random() * Date.now())).toLocaleDateString();
  const randomBool = () => Math.random() > 0.5;
  const randomNumber = (a = 0, b = 1000) => a + Math.floor(Math.random() * b);
  const randomPhrase = () => `${randomCountry()} ${randomName()} ${randomNumber()}`;

  return Array.from({ length: 10 }, () => [
    randomBool(),
    randomName(),
    randomCountry(),
    randomPhrase(),
    randomDate(),
    randomPhrase(),
    randomBool(),
    randomNumber(0, 200).toString(),
    randomNumber(0, 10),
    randomNumber(0, 5),
  ]);
}

const hotSettings = ref<GridSettings>({
  data: generateArabicData(),
  colHeaders: true,
  rowHeaders: true,
  height: 'auto',
  layoutDirection: 'rtl',
  language: 'ar-AR',
  dropdownMenu: true,
  filters: true,
  contextMenu: true,
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

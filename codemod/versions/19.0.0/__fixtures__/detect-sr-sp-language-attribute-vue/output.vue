<template>
  <hot-table :data="rows" language="sr-SP"></hot-table>
  <hot-table :data="rows" :language="'sr-SP'"></hot-table>
  <HotTable :data="rows" language="sr-SP" />
  <HotTable :data="rows" :language="`sr-SP`" />
  <HotTable :data="rows" language="sr-Latn-RS" />
  <HotTable :data="rows" :language="locale" />
</template>

<script setup lang="ts">
import { HotTable } from '@handsontable/vue3';

const rows = [[1, 2]];
const locale = 'pl-PL';
</script>

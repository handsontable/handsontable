<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';
import type { CellValue, RowObject } from 'handsontable/common';

const rows = ref<RowObject[]>([{ id: 1 }]);
const last = ref<CellValue>(null);
</script>

<template>
  <hot-table :data="rows" @after-change="last = $event" />
</template>

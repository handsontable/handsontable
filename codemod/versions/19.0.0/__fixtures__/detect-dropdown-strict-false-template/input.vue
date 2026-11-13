<template>
  <HotTable :settings="settings">
    <HotColumn data="side" type="dropdown" :source="['Buy', 'Sell']" :strict="false" />
    <HotColumn data="flag" type="dropdown" :source="['Buy']" :strict="true" />
  </HotTable>
</template>

<script setup lang="ts">
import { HotTable, HotColumn } from '@handsontable/vue3';

const settings = { licenseKey: 'my-own-key' };
</script>

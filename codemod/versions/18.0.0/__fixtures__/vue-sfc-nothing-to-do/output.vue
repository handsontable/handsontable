<template>
  <hot-table :settings="settings" class="grid" />
</template>

<script>
import { HotTable } from '@handsontable/vue3';

export default {
  components: { HotTable },
  data() {
    return { settings: { data: [[1]], licenseKey: 'non-commercial-and-evaluation' } };
  },
};
</script>

<style>
.grid {
  --ht-border-radius: 4px;
  --ht-wrapper-border-radius-extra: 2px;
}
</style>

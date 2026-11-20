<template>
  <div class="pika-single">
    <hot-table :settings="settings" />
  </div>
</template>

<script>
import Handsontable from 'handsontable';

export default {
  data() {
    return {
      settings: {
        columns: [{ type: 'numeric', numericFormat: { pattern: '0.00' } }],
      },
    };
  },
};
</script>

<style>
.ht-grid > .handsontable {
  border: 0;
}
</style>

<template>
  <hot-table ref="hotRef" :settings="settings"></hot-table>
  <button @click="undo">Undo</button>
</template>

<script>
import { HotTable } from '@handsontable/vue3';

export default {
  components: { HotTable },
  data() {
    return { settings: { undo: true, manualColumnResize: true } };
  },
  methods: {
    undo() {
      this.$refs.hotRef.hotInstance.undo();
    },
    save() {
      const plugin = this.$refs.hotRef.hotInstance.getPlugin('manualColumnResize');

      plugin.saveManualColumnWidths();
    },
  },
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { HotTable } from '@handsontable/vue3';

const hotRef = ref<InstanceType<typeof HotTable> | null>(null);

function redo() {
  hotRef.value?.hotInstance?.redo();
}
</script>

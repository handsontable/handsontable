<template>
  <div id="root">
    <DataGrid />
  </div>
</template>

<script lang="ts">
import Handsontable from 'handsontable';
import { HotTable, HotColumn } from '@handsontable/vue3';
  import { defineComponent } from 'vue';
  import DataGrid from "./components/DataGrid.vue";

console.log(`Handsontable.version ${Handsontable.version}, HotTable.verddsion ${HotTable.version}`);


  export default defineComponent({
    name: "HoT vue 3 demo",
    components: {
      DataGrid
    }
  });
</script>

<template>
  <div id="root">
    <DataGrid/>
  </div>
</template>

<script lang="ts">
import DataGrid from "./components/DataGrid.vue";

export default {
  name: "App",
  components: {
    DataGrid
  }
};
</script>

<template>
  <div>
    <DataGrid />
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import DataGrid from "./components/DataGrid.vue";

  export default defineComponent({
    name: "HoT vue 3 demo",
    components: {
      DataGrid
    }
  });
</script>

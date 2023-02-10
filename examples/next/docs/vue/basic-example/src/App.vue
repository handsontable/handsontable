<template>
  <div id="example">
    <hot-table :settings="hotSettings"></hot-table>
  </div>
</template>

<script>
import { HotTable } from '@handsontable/vue';
import 'handsontable/dist/handsontable.full.css';
import './assets/styles.css';

export default {
  name: 'App',
  data: function () {
    return {
      hotSettings: {
        data: [
          ["", "Ford", "Volvo", "Toyota", "Honda"],
          ["2016", 10, 11, 12, 13],
          ["2017", 20, 11, 14, 13],
          ["2018", 30, 15, 12, 13],
        ],
        colHeaders: true,
        rowHeaders: true,
        licenseKey: "non-commercial-and-evaluation",
        height: '100%',
        width: '100%'
      },
    };
  },
  components: {
    HotTable
  }
}
</script>

<style>
</style>

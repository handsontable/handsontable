<template>
  <hot-table :settings="hotSettings"></hot-table>
</template>

<script>
import { HotTable } from "@handsontable/vue";
import Handsontable from "handsontable";

export default {
  data: function () {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(6, 10),
        colHeaders: true,
        licenseKey: 'non-commercial-and-evaluation'
      },
    };
  },
  components: {
    HotTable,
  },
};
</script>

<style>
@import "~handsontable/dist/handsontable.full.css";
</style>

<template>
  <hot-table :settings="hotSettings">
    <hot-column title="First column header"> </hot-column>
    <hot-column :settings="secondColumnSettings" read-only="true"> </hot-column>
  </hot-table>
</template>

<script>
import { HotTable, HotColumn } from "@handsontable/vue";
import Handsontable from 'handsontable';

export default {
  data: function () {
    return {
      hotSettings: {
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        licenseKey: 'non-commercial-and-evaluation'
      },
      secondColumnSettings: {
        title: "Second column header",
      },
    };
  },
  components: {
    HotTable,
    HotColumn
  },
};
</script>

<style>
@import "~handsontable/dist/handsontable.full.css";
</style>

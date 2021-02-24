<template>
  <hot-table :settings="hotSettings"></hot-table>
</template>

<script>
import "handsontable/dist/handsontable.full.css";

import Handsontable from "handsontable";
import { HotTable } from "@handsontable/vue";
import Vue from "vue";

function getDebugInfo() {
  let debug = "Handsontable:";
  debug += ` v${Handsontable.version}`;
  debug += ` (${Handsontable.buildDate})`;
  debug += " Wrapper:";
  debug += ` v${HotTable.version}`;
  debug += " Vue:";
  debug += ` v${Vue.version}`;
  return debug;
}

console.log(getDebugInfo());

export default {
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
      },
    };
  },
  components: {
    HotTable,
  },
};
</script>

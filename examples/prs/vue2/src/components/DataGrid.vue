<template>
  <div id="example">
    <hot-table
      ref="hotTableComponent"
      :data="data"
      :settings="hotSettings"
    ></hot-table>
  </div>
</template>

<script lang="ts">
import { HotTable } from "@handsontable/vue";
import "handsontable/dist/handsontable.full.css";

import { getData } from "../utils/constants";

import { alignHeaders, addClassesToRows } from "../utils/hooks-callbacks";

export default {
  name: "DataGrid",
  data: function () {
    return {
      hotSettings: {
        height: 450,
        dropdownMenu: true,
        hiddenColumns: {
          indicators: true,
        },
        contextMenu: true,
        multiColumnSorting: true,
        filters: true,
        rowHeaders: true,
        afterGetColHeader: alignHeaders,
        beforeRenderer: addClassesToRows,
        colWidths: [170, 156, 222, 130, 130, 120, 120],
        colHeaders: [
          "Company name",
          "Country",
          "Name",
          "Sell date",
          "Order ID",
          "In stock",
          "Qty",
        ],
        columns: [
          { data: 1, type: "text" },
          { data: 2, type: "text" },
          { data: 3, type: "text" },
          {
            data: 4,
            type: "date",
            allowInvalid: false,
          },
          { data: 5, type: "text" },
          {
            data: 6,
            type: "checkbox",
            className: "htCenter",
          },
          {
            data: 7,
            type: "numeric",
          },
        ],
        autoWrapCol: true,
        autoWrapRow: true,
        licenseKey: "non-commercial-and-evaluation",
      },
      data: getData(),
    };
  },
  components: {
    HotTable,
  },
};
</script>

<style lang="scss">
/*
  A stylesheet customizing app (custom renderers)
*/

table.htCore {
  tr.odd td {
    background: #fafbff;
  }
}

/*
  A stylesheet customizing Handsontable style
*/

.handsontable {
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;

  .htRight .changeType {
    margin: 3px 1px 0 13px;
  }

  .collapsibleIndicator {
    text-align: center;
  }
}
</style>

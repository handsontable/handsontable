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

import { addClassesToRows } from "../utils/hooks-callbacks";

export default {
  name: "DataGrid",
  data: function () {
    return {
      hotSettings: {
        navigableHeaders: true,
        height: 450,
        dropdownMenu: true,
        hiddenColumns: {
          indicators: true,
        },
        contextMenu: true,
        multiColumnSorting: true,
        filters: true,
        rowHeaders: true,
        headerClassName: "htLeft",
        beforeRenderer: addClassesToRows,
        colWidths: [170, 222, 130, 120, 120, 130, 156],
        colHeaders: [
          "Company name",
          "Name",
          "Sell date",
          "In stock",
          "Qty",
          "Order ID",
          "Country",
        ],
        columns: [
          { data: 1, type: "text" },
          { data: 3, type: "text" },
          {
            data: 4,
            type: "date",
            allowInvalid: false,
          },
          {
            data: 6,
            type: "checkbox",
            className: "htCenter",
            headerClassName: "htCenter"
          },
          {
            data: 7,
            type: "numeric",
            headerClassName: "htRight"
          },
          { data: 5, type: "text" },
          { data: 2, type: "text" },
        ],
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

  .collapsibleIndicator {
    text-align: center;
  }
}
</style>

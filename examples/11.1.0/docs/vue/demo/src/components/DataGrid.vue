<template>
  <div id="example">
    <hot-table ref="hotTableComponent" :data="data" :settings="hotSettings"></hot-table>
  </div>
</template>

<script lang="ts">
import { HotTable } from '@handsontable/vue';
import 'handsontable/dist/handsontable.full.css';

import { getData } from "../utils/constants";
import { progressBarRenderer } from "../renderers/progressBar";
import { starsRenderer } from "../renderers/stars";

import {
  alignHeaders,
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "../utils/hooks-callbacks";

export default {
  name: 'DataGrid',
  data: function() {
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
        afterOnCellMouseDown: changeCheckboxCell,
        afterGetColHeader: alignHeaders,
        afterGetRowHeader: drawCheckboxInRowHeaders,
        beforeRenderer: addClassesToRows,
        colWidths: [140, 126, 192, 100, 100, 90, 90, 110, 97],
        colHeaders: [
          "Company name",
          "Country",
          "Name",
          "Sell date",
          "Order ID",
          "In stock",
          "Qty",
          "Progress",
          "Rating"
        ],
        columns: [
          { data: 1, type: "text" },
          { data: 2, type: "text" },
          { data: 3, type: "text" },
          {
            data: 4,
            type: "date",
            allowInvalid: false
          },
          { data: 5, type: "text" },
          {
            data: 6,
            type: "checkbox",
            className: "htCenter"
          },
          {
            data: 7,
            type: "numeric"
          },
          {
            data: 8,
            renderer: progressBarRenderer,
            readOnly: true,
            className: "htMiddle"
          },
          {
            data: 9,
            renderer: starsRenderer,
            readOnly: true,
            className: "star htCenter",
          }
        ],
        licenseKey: "non-commercial-and-evaluation",
      },
      data: getData()
    }
  },
  components: {
    HotTable
  }
}
</script>

<style lang="scss">
/*
  A stylesheet customizing app (custom renderers)
*/

table.htCore {
  tr.odd td {
    background: #fafbff;
  }

  tr.selected td {
    background: #edf3fd;
  }

  td .progressBar {
    background: #37bc6c;
    height: 10px;
  }

  td.star {
    color: #fcb515;
  }
}

/*
  A stylesheet customizing Handsontable style
*/

.handsontable {
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;

  .htRight .changeType {
    margin: 3px 1px 0 13px;
  }

  .collapsibleIndicator {
    text-align: center;
  }
}
</style>

<template>
  <hot-table ref="hotTableComponent" :data="data" :settings="hotSettings"></hot-table>
</template>

<script lang="ts">
import { HotTable } from '@handsontable/vue3';
import { getData } from "../utils/constants";
import { getThemeName } from "../utils/utils";
import { progressBarRenderer } from "../renderers/progressBar";
import { starsRenderer } from "../renderers/stars";

import {
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "../utils/hooks-callbacks";

export default {
  name: 'DataGrid',
  data: function() {
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

    return {
      hotSettings: {
        themeName: getThemeName(),
        height: 450,
        dropdownMenu: true,
        manualRowMove: true,
        hiddenColumns: {
          indicators: true,
        },
        contextMenu: true,
        mergeCells: true,
        multiColumnSorting: true,
        filters: true,
        rowHeaders: true,
        navigableHeaders: true,
        manualColumnMove: true,
        comments: true,
        customBorders: true,
        afterOnCellMouseDown: changeCheckboxCell,
        headerClassName: isRtl ? "htRight" : "htLeft",
        afterGetRowHeader: drawCheckboxInRowHeaders,
        beforeRenderer: addClassesToRows,
        colWidths: [140, 210, 135, 100, 90, 110, 120, 115, 140],
        colHeaders: [
          "Company name",
          "Name",
          "Sell date",
          "In stock",
          "Qty",
          "Progress",
          "Rating",
          "Order ID",
          "Country"
        ],
        columns: [
          { data: 1, type: "text" },
          { data: 3, type: "text" },
          {
            data: 4,
            type: "date",
            allowInvalid: false
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
            headerClassName: "htCenter",
          },
          { data: 5, type: "text" },
          { data: 2, type: "text" }
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
  .handsontable {
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 400;
  }

  .handsontable td .progressBar {
    background: #37bc6c;
    height: 10px;
  }

  .handsontable td.star {
    color: #fcb515;
  }

  .handsontable .htCore tr.selected td {
    background: #edf3fd;
  }

  .handsontable.ht-theme-main-dark .htCore tr.selected td {
    background: #081b3d;
  }

  .handsontable.ht-theme-horizon-dark .htCore tr.selected td {
    background: #3a2901;
  }
</style>

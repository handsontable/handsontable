<template>
  <hot-table ref="hotTableComponent" :data="data" :settings="hotSettings"></hot-table>
</template>

<script lang="ts">
import { HotTable } from '@handsontable/vue';
import "@handsontable/pikaday/css/pikaday.css";
import 'handsontable/dist/handsontable.css';

import { scenarioData } from "../utils/constants";

import {
  alignHeaders,
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "../utils/hooks-callbacks";

export default {
  name: 'ScenarioGrid',
  data: function() {
    return {
      hotSettings: {
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
        afterGetColHeader: alignHeaders,
        afterGetRowHeader: drawCheckboxInRowHeaders,
        beforeRenderer: addClassesToRows,
        colHeaders: [
        'Product ID',
        'Mobile Apps',
        'Pricing',
        'Rating',
        'Category',
        'Industry',
        'Business Scale',
        'User Type',
        'No of Users',
        'Deployment',
        'OS',
        ],
        columns: [
        { data: 'product_id', type: 'numeric' },
        { data: 'mobile_apps', type: 'text' },
        { data: 'pricing', type: 'text' },
        { data: 'rating', type: 'numeric' },
        { data: 'category', type: 'text' },
        { data: 'industry', type: 'text' },
        { data: 'business_scale', type: 'text' },
        { data: 'user_type', type: 'text' },
        { data: 'no_of_users', type: 'text' },
        { data: 'deployment', type: 'text' },
        { data: 'OS', type: 'text' },
        ],
        licenseKey: "non-commercial-and-evaluation",
      },
      data: scenarioData
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

  .collapsibleIndicator {
    text-align: center;
  }
}
</style>

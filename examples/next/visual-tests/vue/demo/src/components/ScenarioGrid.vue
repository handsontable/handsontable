<template>
  <div>
    <input type="text" class="input-spacing" placeholder="Input 1"/>
    <hot-table
      ref="hotTableComponent1"
      :data="dataTop"
      :settings="hotSettings1"
    ></hot-table>
    <input type="text" class="input-spacing" placeholder="Input 2"/>
    <hot-table
      ref="hotTableComponent2"
      :data="dataBottom"
      :settings="hotSettings2"
    ></hot-table>
  </div>
</template>

<script lang="ts">
import { HotTable } from '@handsontable/vue';
import '@handsontable/pikaday/css/pikaday.css';
import 'handsontable/dist/handsontable.css';
import { HyperFormula } from 'hyperformula';

import { scenarioDataTop, scenarioDataBottom } from '../utils/constants';

export default {
  name: 'ScenarioGrid',
  data: function () {
    return {
      dataTop: scenarioDataTop,
      dataBottom: scenarioDataBottom,
      hotSettings1: {
        height: 350,
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
        fixedRowsBottom: 2,
        formulas: {
          engine: HyperFormula,
        },
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
        licenseKey: 'non-commercial-and-evaluation',
      },
      hotSettings2: {
        height: 250,
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
        nestedRows: true,
        colHeaders: [
          'Category',
          'Product ID',
          'Industry',
          'Business Scale',
          'User Type',
          'No of Users',
          'Deployment',
          'OS',
          'Mobile Apps',
          'Pricing',
          'Rating',
        ],
        columns: [
          { data: 'category', type: 'text' },
          { data: 'product_id', type: 'numeric' },
          { data: 'industry', type: 'text' },
          { data: 'business_scale', type: 'text' },
          { data: 'user_type', type: 'text' },
          { data: 'no_of_users', type: 'text' },
          { data: 'deployment', type: 'text' },
          { data: 'OS', type: 'text' },
          { data: 'mobile_apps', type: 'text' },
          { data: 'pricing', type: 'text' },
          { data: 'rating', type: 'numeric' },
        ],
        licenseKey: 'non-commercial-and-evaluation',
      },
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
.input-spacing {
  margin: 10px;
}

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

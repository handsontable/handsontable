<template>
  <div>
    <div id='tableTop'>

      <input type="text" class="input-spacing" placeholder="Input 1" />
      <hot-table ref="hotTableComponent1" :data="dataTop" :settings="hotSettings1"></hot-table>
    </div>
    <div id='tableBottom'>
      <input type="text" class="input-spacing" placeholder="Input 2" />
      <hot-table ref="hotTableComponent2" :data="dataBottom" :settings="hotSettings2"></hot-table>
    </div>
  </div>
</template>

<script lang="ts">
import { HotTable } from '@handsontable/vue';
import { getThemeName } from "../utils/utils";
import { scenarioDataTop, scenarioDataBottom } from '../utils/constants';

export default {
  name: 'ScenarioGrid',
  data: function () {
    return {
      dataTop: scenarioDataTop,
      dataBottom: scenarioDataBottom,
      hotSettings1: {
        themeName: getThemeName(),
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
        colHeaders: true,
        nestedHeaders: [
          [
            { label: 'Product', colspan: 4 },
            { label: 'Category', colspan: 3 },
            { label: 'User', colspan: 2 },
            { label: 'System', colspan: 2 },
          ],
          [
            'Product ID',
            'Mobile Apps',
            'Pricing',
            'Rating',
            'Data Type',
            'Industry',
            'Business Scale',
            'User Type',
            'No of Users',
            'Deployment',
            'OS',
          ],
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
        collapsibleColumns: true,
        licenseKey: 'non-commercial-and-evaluation',
      },
      hotSettings2: {
        themeName: getThemeName(),
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
        bindRowsWithHeaders: true,
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
        columnSummary: [
          {
            sourceColumn: 10,
            type: 'average',
            destinationRow: 0,
            destinationColumn: 10,
            // force this column summary to treat non-numeric values as numeric values
            forceNumeric: true
          },
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

  .input-spacing {
    margin: 10px;
  }

  .handsontable .ht_nestingParent,
  .handsontable .ht_nestingParent~td {
    background: #B5B5B5;
    color: #222;
  }
</style>

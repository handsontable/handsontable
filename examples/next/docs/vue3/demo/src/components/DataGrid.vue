<script lang="ts">
import { defineComponent } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';

import { data } from '../constants';

import { alignHeaders } from '../hooks-callbacks';

// register Handsontable's modules
registerAllModules();

export default defineComponent({
  name: 'DataGrid',
  components: {
    HotTable,
    HotColumn,
  },
  computed: {
    alignHeadersProp() {
      return alignHeaders;
    },

    dataProp() {
      return data;
    },
  },
});
</script>

<template>
  <div id="example">
    <HotTable
      :data="dataProp"
      :height="450"
      :colWidths="[170, 222, 130, 120, 120, 140, 156]"
      :colHeaders="[
        'Company name',
        'Name',
        'Sell date',
        'In stock',
        'Qty',
        'Order ID',
        'Country',
      ]"
      :dropdownMenu="true"
      :hiddenColumns="{
        indicators: true,
      }"
      :contextMenu="true"
      :multiColumnSorting="true"
      :filters="true"
      :rowHeaders="true"
      :afterGetColHeader="alignHeadersProp"

      :manualRowMove="true"
      :autoWrapRow="true"
      :autoWrapCol="true"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="companyName" />
      <HotColumn data="name" />
      <HotColumn data="sellDate" type="date" :allowInvalid="false" />
      <HotColumn
        data="inStock"
        type="checkbox"
        className="htCenter"
        headerClassName="htCenter"
        ,
      />
      <HotColumn data="quantity" type="numeric" />
      <HotColumn data="orderId" />
      <HotColumn data="country" />
    </HotTable>
  </div>
</template>

<style lang="css">
/*
  A stylesheet customizing app (custom renderers)
*/

/*
  A stylesheet customizing Handsontable style
*/

.handsontable {
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
}

.handsontable .collapsibleIndicator {
  text-align: center;
}

table.htCore tr.ht__row_odd td {
  background: #fafbff;
}

td .error {
  background: #ff4c42;
}
</style>

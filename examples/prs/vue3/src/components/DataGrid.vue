<script lang="ts">
import { defineComponent } from "vue";
import { HotTable, HotColumn } from "@handsontable/vue3";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";

import { data } from "../data";

// register Handsontable's modules
registerAllModules();

export default defineComponent({
  name: "DataGrid",
  components: {
    HotTable,
    HotColumn,
  },
  computed: {
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
    :colHeaders="[
          'ID',
          'Item Name',
          'Item No.',
          'Lead Engineer',
          'Cost',
          'In Stock',
          'Category',
          'Item Quality',
          'Origin',
          'Quantity',
          'Value Stock',
          'Repairable',
          'Supplier Name',
          'Restock Date',
          'Operational Status',
    ]" 
    :dropdownMenu="true" 
    :hiddenColumns="{
        columns: [0, 2], 
        indicators: true,
      }" 
    :contextMenu="true" 
    :multiColumnSorting="true" 
    :filters="true" 
    :rowHeaders="true" headerClassName="htLeft"
    :manualRowMove="true" 
    :autoWrapRow="true" 
    :autoWrapCol="true"
    licenseKey="non-commercial-and-evaluation">
      <HotColumn data="id" type="numeric" [width]="150"></HotColumn>
      <HotColumn data="itemName" type="text" headerClassName="htLeft" className="htLeft" [width]="150"></HotColumn>
      <HotColumn data="itemNo" type="text" headerClassName="htLeft" className="htLeft" [width]="150"></HotColumn>
      <HotColumn data="leadEngineer" type="text" headerClassName="htLeft" className="htLeft"></HotColumn>
      <HotColumn data="cost" type="numeric" headerClassName="htRight" className="htRight"></HotColumn>
      <HotColumn data="inStock" type="checkbox" className="htCenter" headerClassName="htCenter"></HotColumn>
      <HotColumn data="category" type="text" headerClassName="htLeft" className="htLeft"></HotColumn>
      <HotColumn data="itemQuality" type="text" headerClassName="htLeft" className="htLeft"></HotColumn>
      <HotColumn data="origin" type="text" headerClassName="htLeft" className="htLeft"></HotColumn>
      <HotColumn data="quantity" type="numeric" headerClassName="htRight" className="htRight"></HotColumn>
      <HotColumn data="valueStock" type="numeric" headerClassName="htRight" className="htRight"></HotColumn>
      <HotColumn data="repairable" type="checkbox" className="htCenter" headerClassName="htCenter"></HotColumn>
      <HotColumn data="supplierName" type="text" headerClassName="htLeft" className="htLeft"></HotColumn>
      <HotColumn data="restockDate" type="date" [allowInvalid]="false" headerClassName="htLeft" className="htLeft">
      </HotColumn>
      <HotColumn data="operationalStatus" type="text" headerClassName="htLeft" className="htLeft"></HotColumn>
    </HotTable>
  </div>
</template>

<style lang="css">
/*
  A stylesheet customizing app (custom renderers)
*/

table.htCore tr.odd td {
  background: #fafbff;
}

/*
  A stylesheet customizing Handsontable style
*/

.handsontable {
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;
}

.handsontable .collapsibleIndicator {
  text-align: center;
}

td .error {
  background: #ff4c42;
}
</style>

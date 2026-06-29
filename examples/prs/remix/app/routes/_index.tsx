import { HotTable, HotColumn } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";
import { data } from "../data";

registerAllModules();

export default function Index() {
  return (
    <div style={{ padding: "1rem" }}>
      <HotTable
        data={data}
        colHeaders={[
          "ID",
          "Item Name",
          "Item No.",
          "Lead Engineer",
          "Cost",
          "Supplier Name",
          "Restock Date",
          "Operational Status",
          "Origin",
          "Quantity",
          "Value Stock",
          "Repairable",
        ]}
        rowHeaders={true}
        height={450}
        autoWrapRow={true}
        autoWrapCol={true}
        dropdownMenu={true}
        filters={true}
        multiColumnSorting={true}
        hiddenColumns={{
          columns: [0, 2],
          indicators: true,
        }}
        licenseKey="non-commercial-and-evaluation"
      >
        <HotColumn data="id" type="numeric" width={150} />
        <HotColumn data="itemName" type="text" className="htLeft" width={150} />
        <HotColumn data="itemNo" type="text" className="htLeft" width={150} />
        <HotColumn data="leadEngineer" type="text" className="htLeft" width={150} />
        <HotColumn data="cost" type="numeric" />
        <HotColumn data="supplierName" type="text" className="htLeft" width={150} />
        <HotColumn data="restockDate" type="date" className="htCenter" width={150} />
        <HotColumn data="operationalStatus" type="text" className="htCenter" width={150} />
        <HotColumn data="origin" type="text" className="htLeft" width={150} />
        <HotColumn data="quantity" type="numeric" className="htRight" width={150} />
        <HotColumn data="valueStock" type="numeric" numericFormat={{ pattern: "$0 0" }} className="htRight" width={150} />
        <HotColumn data="repairable" type="checkbox" className="htCenter" width={100} />
      </HotTable>
    </div>
  );
}

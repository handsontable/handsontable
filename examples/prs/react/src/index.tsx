import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import "pikaday/css/pikaday.css";
import "./styles.css";
import { HotTable, HotColumn } from "@handsontable/react";
import { data } from "./constants";

import { addClassesToRows } from "./hooksCallbacks";

import "handsontable/dist/handsontable.min.css";
import { registerAllModules } from 'handsontable/registry'

registerAllModules();
const App = () => {
  return (
    <HotTable
      data={data}
      height={450}
      colWidths={[170, 156, 222, 130, 130, 120, 120]}
      colHeaders={[
        "Company name",
        "Country",
        "Name",
        "Sell date",
        "Order ID",
        "In stock",
        "Qty",
      ]}
      dropdownMenu={true}
      hiddenColumns={{
        indicators: true,
      }}
      contextMenu={true}
      multiColumnSorting={true}
      filters={true}
      rowHeaders={true}
      autoWrapCol={true}
      autoWrapRow={true}
      headerClassName="htLeft"
      beforeRenderer={addClassesToRows}
      manualRowMove={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data={1} />
      <HotColumn data={2} />
      <HotColumn data={3} />
      <HotColumn data={4} type="date" allowInvalid={false} />
      <HotColumn data={5} />
      <HotColumn data={6} type="checkbox" className="htCenter" headerClassName="htCenter" />
      <HotColumn data={7} type="numeric" headerClassName="htRight" />
    </HotTable>
  );
};

const container = document.getElementById("container");
const root = createRoot(container!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

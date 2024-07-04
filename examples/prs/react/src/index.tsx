import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "pikaday/css/pikaday.css";
import "./styles.css";
import { HotTable, HotColumn } from "@handsontable/react";
import { data } from "./constants";

import { addClassesToRows, alignHeaders } from "./hooksCallbacks";

import "handsontable/dist/handsontable.min.css";

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
      afterGetColHeader={alignHeaders}
      beforeRenderer={addClassesToRows}
      manualRowMove={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data={1} />
      <HotColumn data={2} />
      <HotColumn data={3} />
      <HotColumn data={4} type="date" allowInvalid={false} />
      <HotColumn data={5} />
      <HotColumn data={6} type="checkbox" className="htCenter" />
      <HotColumn data={7} type="numeric" />
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

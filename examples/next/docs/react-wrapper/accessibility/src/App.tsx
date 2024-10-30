import { HotTable, HotColumn } from "@handsontable/react-wrapper";
import { useState } from "react";

import { countries, data } from "./data";
import DemoOptions from "./DemoOptions";

import "handsontable/dist/handsontable.full.min.css";

import { registerAllModules } from 'handsontable/registry';

registerAllModules();

// Handsontable options
const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Order ID",
    "Country",
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  headerClassName: "htLeft",
  licenseKey: "non-commercial-and-evaluation",
};

export interface ToggleableOptions {
  tabNavigation: boolean;
  navigableHeaders: boolean;
  renderAllRows: boolean;
  enterBeginsEditing: boolean;
  autoWrapRow: boolean;
  autoWrapCol: boolean;
  enterMoves: { col: number; row: number };
}

function App() {
  const [toggleableOptions, setToggleableOptions] = useState<ToggleableOptions>(
    {
      tabNavigation: true,
      navigableHeaders: true,
      renderAllRows: false,
      enterBeginsEditing: true,
      autoWrapRow: true,
      autoWrapCol: true,
      enterMoves: { col: 0, row: 1 },
    }
  );

  return (
    <>
      {/* DemoOptions component for changing Handsontable options */}
      <DemoOptions
        changeToggleOptions={setToggleableOptions}
        {...toggleableOptions}
      />

      <input
        className="placeholder-input"
        type="text"
        placeholder="Focusable text input"
      />

      {/* Handsontable component with dynamic options */}
      <HotTable
        // Handsontable needs to reload when changing virtualization
        // by changing the key, we force the component to reload
        key={String(toggleableOptions.renderAllRows)}
        {...hotOptions}
        // Pass in the options which can change for demo
        {...toggleableOptions}
      >
        {/* Define HotColumns for the data */}
        <HotColumn data="companyName" type="text" />
        <HotColumn data="productName" type="text" />
        <HotColumn
          data="sellDate"
          dateFormat="DD/MM/YYYY"
          correctFormat
          type="date"
          allowInvalid={false}
        />
        <HotColumn data="inStock" type="checkbox" className="htCenter" headerClassName="htCenter" />
        <HotColumn data="qty" type="numeric" headerClassName="htRight" />
        <HotColumn data="orderId" type="text" />
        <HotColumn data="country" type="dropdown" source={countries} />
      </HotTable>
      <input
        className="placeholder-input"
        type="text"
        placeholder="Focusable text input"
      />
    </>
  );
}

export default App;

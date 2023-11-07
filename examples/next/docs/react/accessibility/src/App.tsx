import "./App.css";
import "handsontable/dist/handsontable.min.css";
import { HotTable, HotColumn } from "@handsontable/react";
import { useState } from "react";
import { ProgressBarRenderer } from "./components/ProgressBarRenderer";
import { StarsRenderer } from "./components/StarsRenderer";

import { countries, data } from "./data";
import DemoOptions from "./components/DemoOptions";
import {
  alignHeaders,
  addClassesToRows,
  changeCheckboxCell,
} from "./hooksCallbacks";

const hotOptions = {
  data,
  height: 464,
  colWidths: [140, 165, 100, 100, 100, 90, 90, 110, 178],
  colHeaders: [
    "Company name",
    "Product name",
    "Sell date",
    "In stock",
    "Qty",
    "Progress",
    "Rating",
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
  nestedRows: true,
  afterGetColHeader: alignHeaders,
  beforeRenderer: addClassesToRows,
  afterOnCellMouseDown: changeCheckboxCell,
  licenseKey: "non-commercial-and-evaluation",
};

export interface ToggleableOptions {
  disableTabNavigation: boolean;
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
      disableTabNavigation: false,
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
      <DemoOptions
        changeToggleOptions={setToggleableOptions}
        {...toggleableOptions}
      />
      <input type="text" placeholder="Focusable text input" />
      <HotTable
        // allows us to re-render on virtualization change
        key={String(toggleableOptions.renderAllRows)}
        {...hotOptions}
        {...toggleableOptions}
      >
        <HotColumn data="companyName" type="text" />
        <HotColumn data="productName" type="text" />
        <HotColumn data="sellDate" type="date" allowInvalid={false} />
        <HotColumn data="inStock" type="checkbox" className="htCenter" />
        <HotColumn data="qty" type="numeric" />
        <HotColumn data="progress" readOnly={true} className="htMiddle">
          <ProgressBarRenderer hot-renderer />
        </HotColumn>
        <HotColumn data="rating" readOnly={true} className="htCenter">
          <StarsRenderer hot-renderer />
        </HotColumn>
        <HotColumn data="orderId" type="text" />
        <HotColumn data="country" type="dropdown" source={countries} />
      </HotTable>
      <input type="text" placeholder="Focusable text input" />
    </>
  );
}

export default App;

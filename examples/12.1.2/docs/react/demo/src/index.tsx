import React from "react";
import ReactDOM from "react-dom";
import "pikaday/css/pikaday.css";
import "./styles.css";
import Handsontable from 'handsontable';
import { HotTable, HotColumn } from "@handsontable/react";
import { data } from "./constants";
import { ProgressBarRenderer } from "./renderers/ProgressBar";
import { StarsRenderer } from "./renderers/Stars";

import {
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell,
  alignHeaders
} from "./hooksCallbacks";

import "handsontable/dist/handsontable.min.css";

const App = () => {
  return (
    <HotTable
      data={data}
      height={450}
      colWidths={[140, 192, 100, 90, 90, 110, 97, 100, 126]}
      colHeaders={[
        "Company name",
        "Name",
        "Sell date",
        "In stock",
        "Qty",
        "Progress",
        "Rating",
        "Order ID",
        "Country"
      ]}
      dropdownMenu={true}
      hiddenColumns={{
        indicators: true
      }}
      contextMenu={true}
      multiColumnSorting={true}
      filters={true}
      rowHeaders={true}
      afterGetColHeader={alignHeaders}
      beforeRenderer={addClassesToRows}
      afterGetRowHeader={drawCheckboxInRowHeaders}
      afterOnCellMouseDown={changeCheckboxCell}
      beforePaste={(data, coords) => {
        const {startCol} = coords[0];
        if ((startCol === 5 || startCol === 6) && isNaN(data[0] as any)) {
          return false
        } 
      }}
      manualRowMove={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data="companyName" />
      <HotColumn data="name" />
      <HotColumn data="sellDate" type="date" allowInvalid={false} />
      <HotColumn data="inStock" type="checkbox" className="htCenter" />
      <HotColumn data="quantity" type="numeric" />
      <HotColumn data="progress" className="htMiddle" type="numeric">
        {/* @ts-ignore Element inherits some props. It's hard to type it. */}
        <ProgressBarRenderer hot-renderer hot-editor />
      </HotColumn>
      <HotColumn data="rating" className="htCenter" type="numeric">
        {/* @ts-ignore Element inherits some props. It's hard to type it. */}
        <StarsRenderer hot-renderer hot-editor />
      </HotColumn>
      <HotColumn data="orderId" />
      <HotColumn data="country" />
    </HotTable>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} React: v${React.version}`);


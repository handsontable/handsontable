import React from "react";
import ReactDOM from "react-dom";
import "@handsontable/pikaday/css/pikaday.css";
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

import "handsontable/dist/handsontable.css";

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
      mergeCells={true}
      manualRowMove={true}
      navigableHeaders={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data={1} />
      <HotColumn data={3} />
      <HotColumn data={4} type="date" allowInvalid={false} />
      <HotColumn data={6} type="checkbox" className="htCenter" />
      <HotColumn data={7} type="numeric" />
      <HotColumn data={8} readOnly={true} className="htMiddle" renderer={ProgressBarRenderer} />
      <HotColumn data={9} readOnly={true} className="htCenter" renderer={StarsRenderer} />
      <HotColumn data={5} />
      <HotColumn data={2} />
    </HotTable>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} React: v${React.version}`);

import "@handsontable/pikaday/css/pikaday.css";
import "./styles.css";
import { HotTable, HotColumn } from "@handsontable/react";
import { data } from "./constants";
import { ProgressBarRenderer } from "./renderers/ProgressBar";
import { StarsRenderer } from "./renderers/Stars";

import {
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./hooksCallbacks";

import "handsontable/dist/handsontable.css";

const DataGrid = () => {
  const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

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
      headerClassName={isRtl ? "htRight" : "htLeft"}
      beforeRenderer={addClassesToRows}
      afterGetRowHeader={drawCheckboxInRowHeaders}
      afterOnCellMouseDown={changeCheckboxCell}
      mergeCells={true}
      manualRowMove={true}
      navigableHeaders={true}
      comments={true}
      manualColumnMove={true}
      customBorders={true}
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn data={1} />
      <HotColumn data={3} />
      <HotColumn data={4} type="date" allowInvalid={false} />
      <HotColumn data={6} type="checkbox" className="htCenter" headerClassName="htCenter" />
      <HotColumn data={7} type="numeric" headerClassName="htRight" />
      <HotColumn data={8} readOnly={true} className="htMiddle">
        <ProgressBarRenderer hot-renderer />
      </HotColumn>
      <HotColumn data={9} readOnly={true} className="htCenter" headerClassName="htCenter">
        <StarsRenderer hot-renderer />
      </HotColumn>
      <HotColumn data={5} />
      <HotColumn data={2} />
    </HotTable>
  );
}

export default DataGrid;

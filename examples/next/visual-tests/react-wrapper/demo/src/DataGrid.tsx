import "./styles.css";
import { HotTable, HotColumn } from "@handsontable/react-wrapper";
import { data } from "./constants";
import { getThemeName } from "./utils";
import { ProgressBarRenderer } from "./renderers/ProgressBar";
import { StarsRenderer } from "./renderers/Stars";

import {
  drawCheckboxInRowHeaders,
  addClassesToRows,
  changeCheckboxCell
} from "./hooksCallbacks";

const DataGrid = () => {
  const isRtl = document.documentElement.getAttribute('dir') === 'rtl';

  return (
    <HotTable
      data={data}
      themeName={getThemeName()}
      height={450}
      colWidths={[140, 210, 135, 100, 90, 110, 120, 115, 140]}
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
      <HotColumn data={8} readOnly={true} className="htMiddle" renderer={ProgressBarRenderer}/>
      <HotColumn data={9} readOnly={true} className="htCenter" headerClassName="htCenter" renderer={StarsRenderer} />
      <HotColumn data={5} />
      <HotColumn data={2} />
    </HotTable>
  );
}

export default DataGrid;

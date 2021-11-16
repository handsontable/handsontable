import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

const hotData = Handsontable.helper.createSpreadsheetData(10, 10);
const secondColumnSettings = {
  title: "Second column header",
  readOnly: true
};

const App = () => {
  return (
    <HotTable data={hotData} licenseKey="non-commercial-and-evaluation">
      <HotColumn title="First column header" />
      <HotColumn settings={secondColumnSettings} />
    </HotTable>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

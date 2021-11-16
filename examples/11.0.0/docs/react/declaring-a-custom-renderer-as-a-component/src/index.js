import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { RendererComponent } from "./rendererComponent";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

const hotData = Handsontable.helper.createSpreadsheetData(10, 10);

const App = () => {
  return (
    <HotTable data={hotData} licenseKey="non-commercial-and-evaluation">
      <HotColumn width={250}>
        <RendererComponent hot-renderer />
      </HotColumn>
    </HotTable>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

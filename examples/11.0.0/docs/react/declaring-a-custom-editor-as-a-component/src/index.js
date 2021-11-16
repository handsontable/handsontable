import React from "react";
import ReactDOM from "react-dom";
import { EditorComponent } from "./editorComponent";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

const hotSettings = {
  data: [
    ["Obrien Fischer"],
    ["Alexandria Gordon"],
    ["John Stafford"],
    ["Regina Waters"],
    ["Kay Bentley"],
    ["Emerson Drake"],
    ["Dean Stapleton"]
  ],
  rowHeaders: true,
  licenseKey: "non-commercial-and-evaluation"
};

const App = () => {
  return (
    <HotTable settings={hotSettings}>
      <HotColumn width={250}>
        <EditorComponent hot-editor />
      </HotColumn>
    </HotTable>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

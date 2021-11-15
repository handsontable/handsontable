import React, { useState } from "react";
import ReactDOM from "react-dom";
import Handsontable from "handsontable";
import { CustomRenderer } from "./customRenderer";
import { HighlightContext } from "./highlightContext";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";
import "./styles.css";

const hotSettings = {
  data: Handsontable.helper.createSpreadsheetData(10, 1),
  rowHeaders: true,
  licenseKey: "non-commercial-and-evaluation"
};

const App = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (event) => {
    setDarkMode(event.target.checked);
  };

  return (
    <HighlightContext.Provider value={darkMode}>
      <h3>
        <input id="dark-mode" type="checkbox" onClick={toggleDarkMode} />{" "}
        <label htmlFor="dark-mode">Dark mode</label>
      </h3>
      <HotTable settings={hotSettings}>
        <HotColumn>
          <CustomRenderer hot-renderer />
        </HotColumn>
      </HotTable>
    </HighlightContext.Provider>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

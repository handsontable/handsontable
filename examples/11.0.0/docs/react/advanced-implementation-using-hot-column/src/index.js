import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { HotTable, HotColumn } from "@handsontable/react";
import "handsontable/dist/handsontable.min.css";

import { Provider, reduxStore } from "./reduxStore";
import { StarRatingRenderer } from "./starRatingRenderer";
import { ColorPicker } from "./colorPicker";

const hotSettings = {
  data: [
    [1, "#ff6900", "#fcb900"],
    [2, "#fcb900", "#7bdcb5"],
    [3, "#7bdcb5", "#8ed1fc"],
    [4, "#00d084", "#0693e3"],
    [5, "#eb144c", "#abb8c3"]
  ],
  rowHeaders: true,
  rowHeights: 30,
  colHeaders: ["Rating", "Active star color", "Inactive star color"],
  licenseKey: "non-commercial-and-evaluation"
};

const App = () => {
  useEffect(() => {
    reduxStore.dispatch({
      type: "initRatingColors",
      hotData: hotSettings.data
    });
  }, []);

  return (
    <Provider store={reduxStore}>
      <HotTable settings={hotSettings}>
        <HotColumn width={100} type={"numeric"}>
          <StarRatingRenderer hot-renderer />
        </HotColumn>
        <HotColumn width={150}>
          <ColorPicker hot-renderer hot-editor />
        </HotColumn>
        <HotColumn width={150}>
          <ColorPicker hot-renderer hot-editor />
        </HotColumn>
      </HotTable>
    </Provider>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

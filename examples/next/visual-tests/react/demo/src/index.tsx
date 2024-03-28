import React from "react";
import ReactDOM from "react-dom";import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Handsontable from 'handsontable';
import { HotTable } from "@handsontable/react";
import Scenario1 from './apps/Scenario1';
import OriginalDemo from './apps/OriginalDemo';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OriginalDemo />} />
        <Route path="/scenario1" element={<Scenario1 />} />
      </Routes>
    </Router>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

console.log(`Handsontable: v${Handsontable.version} (${Handsontable.buildDate}) Wrapper: v${HotTable.version} React: v${React.version}`);

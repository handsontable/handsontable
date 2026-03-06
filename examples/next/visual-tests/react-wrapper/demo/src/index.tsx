import { createRoot } from "react-dom/client";
import "./styles.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DataGrid from "./DataGrid";
import ScenarioTwoGrid from "./ScenarioTwoGrid";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DataGrid />} />
        <Route path="/scenario-grid" element={<ScenarioTwoGrid />} />
      </Routes>
    </Router>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);

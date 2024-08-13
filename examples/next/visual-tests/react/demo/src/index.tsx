import ReactDOM from "react-dom";
import "@handsontable/pikaday/css/pikaday.css";
import "./styles.css";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DataGrid from './DataGrid';
import ScenarioTwoGrid from './ScenarioTwoGrid';
import EditorsGrid from './EditorsGrid';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DataGrid />} />
        <Route path="/scenario-grid" element={<ScenarioTwoGrid />} />
        <Route path="/editors-grid" element={<EditorsGrid />} />
      </Routes>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

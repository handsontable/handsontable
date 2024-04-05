import ReactDOM from "react-dom";
import "@handsontable/pikaday/css/pikaday.css";
import "./styles.css";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DataGrid from './DataGrid';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DataGrid />} />
      </Routes>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
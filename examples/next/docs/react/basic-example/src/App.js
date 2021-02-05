import React from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';


function App() {
  const [settings, setSettings] = React.useState({
    data: Handsontable.helper.createSpreadsheetData(15, 20),
    width: 570,
    height: 220,
    licenseKey: 'non-commercial-and-evaluation'
  });

  const handleChange = (setting, states) => event => {
    setSettings({
      [setting]: states[event.target.checked ? 1 : 0]
    })
  }

  return (
    <div className="App">
      <div className="controllers">
        <label>
          <input onChange={handleChange('fixedRowsTop', [0, 2])} type="checkbox" />
          Add fixed rows
          </label>
        <br />
        <label>
          <input onChange={handleChange('fixedColumnsLeft', [0, 2])} type="checkbox" />
          Add fixed columns
          </label>
        <br />
        <label>
          <input onChange={handleChange('rowHeaders', [false, true])} type="checkbox" />
          Enable row headers
          </label>
        <br />
        <label>
          <input onChange={handleChange('colHeaders', [false, true])} type="checkbox" />
          Enable column headers
          </label>
        <br />
      </div>
      <HotTable settings={settings} />
    </div>
  );
}

export default App;

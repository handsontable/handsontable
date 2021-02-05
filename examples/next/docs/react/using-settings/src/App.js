import React from 'react';
import { HotTable } from '@handsontable/react';

function App() {
  const data = [
    ["", "Ford", "Volvo", "Toyota", "Honda"],
    ["2016", 10, 11, 12, 13],
    ["2017", 20, 11, 14, 13],
    ["2018", 30, 15, 12, 13]
  ]

  return (
    <div className="App">
      <HotTable
        settings={{
          data,
          colHeaders: true,
          rowHeaders: true,
          licenseKey: 'non-commercial-and-evaluation'
        }}
      />
    </div>
  );
}

export default App;

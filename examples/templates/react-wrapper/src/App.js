import React from 'react';
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react-wrapper';

function getDebugInfo() {
  let debug = 'Handsontable:';
  debug += ` v${Handsontable.version}`;
  debug += ` (${Handsontable.buildDate})`;
  debug += ' Wrapper:';
  debug += ` v${HotTable.version}`;
  debug += ' React:';
  debug += ` v${React.version}`;
  return debug;
}

function App() {
  const data = [
    ["", "Ford", "Volvo", "Toyota", "Honda"],
    ["2016", 10, 11, 12, 13],
    ["2017", 20, 11, 14, 13],
    ["2018", 30, 15, 12, 13]
  ]

  return (
    <div id="example">
      <HotTable
        data={data}
        width="100%"
        height="100%"
        colHeaders={true}
        rowHeaders={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
}

console.log(getDebugInfo());

export default App;

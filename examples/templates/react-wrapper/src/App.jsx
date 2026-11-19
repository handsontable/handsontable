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
        // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
        data={data}
        width="100%"
        height="auto"
        colHeaders={true}
        rowHeaders={true}
      />
    </div>
  );
}

console.log(getDebugInfo());

export default App;

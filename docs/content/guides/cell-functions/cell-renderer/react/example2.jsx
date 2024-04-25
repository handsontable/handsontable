import React, { useState, useContext } from 'react';
import { HotTable, HotColumn } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

// a component
const HighlightContext = React.createContext();

// a renderer component
function CustomRenderer(props) {
  const darkMode = useContext(HighlightContext);

  if (darkMode) {
    props.TD.className = 'dark';
  } else {
    props.TD.className = '';
  }

  return <div>{props.value}</div>;
}

const ExampleComponent = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (event) => {
    setDarkMode(event.target.checked);
  };

  return (
    <HighlightContext.Provider value={darkMode}>
      <div className="controls">
        <label><input type="checkbox" onClick={toggleDarkMode}/> Dark mode</label>
      </div>
      <HotTable
        data={[
          ['A1'],
          ['A2'],
          ['A3'],
          ['A4'],
          ['A5'],
          ['A6'],
          ['A7'],
          ['A8'],
          ['A9'],
          ['A10'],
        ]}
        rowHeaders={true}
        height="auto"
        licenseKey={"non-commercial-and-evaluation"}
      >
        <HotColumn>
          {/* add the `hot-renderer` attribute to mark the component as a Handsontable renderer */}
          <CustomRenderer hot-renderer />
        </HotColumn>
      </HotTable>
    </HighlightContext.Provider>
  );
};

export default ExampleComponent;

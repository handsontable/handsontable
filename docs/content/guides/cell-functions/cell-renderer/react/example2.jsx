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

export const ExampleComponent = () => {
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
        licenseKey={"non-commercial-and-evaluation"}
      >
        {/* add the `renderer` prop to set the component as a Handsontable renderer */}
        <HotColumn renderer={CustomRenderer} />
      </HotTable>
    </HighlightContext.Provider>
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example2'));
/* end:skip-in-preview */

import { useState, useContext, createContext } from 'react';
import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// a component
const HighlightContext = createContext(false);

// a renderer component
function CustomRenderer(props) {
  const darkMode = useContext(HighlightContext);

  if (!props.TD) return;

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
        <label>
          <input type="checkbox" onClick={toggleDarkMode} /> Dark mode
        </label>
      </div>
      <HotTable
        data={[['A1'], ['A2'], ['A3'], ['A4'], ['A5'], ['A6'], ['A7'], ['A8'], ['A9'], ['A10']]}
        rowHeaders={true}
        autoRowSize={false}
        autoColumnSize={false}
        height="auto"
        licenseKey={'non-commercial-and-evaluation'}
      >
        <HotColumn renderer={CustomRenderer} />
      </HotTable>
    </HighlightContext.Provider>
  );
};

export default ExampleComponent;

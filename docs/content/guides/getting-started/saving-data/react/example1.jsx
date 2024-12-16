import { useState, useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const [output, setOutput] = useState('Click "Load" to load data from server');
  const [isAutosave, setIsAutosave] = useState(false);
  const autosaveClickCallback = (event) => {
    const target = event.target;

    setIsAutosave(target.checked);

    if (target.checked) {
      setOutput('Changes will be autosaved');
    } else {
      setOutput('Changes will not be autosaved');
    }
  };

  const loadClickCallback = (event) => {
    const hot = hotRef.current?.hotInstance;

    fetch('{{$basePath}}/scripts/json/load.json').then((response) => {
      response.json().then((data) => {
        hot?.loadData(data.data);
        // or, use `updateData()` to replace `data` without resetting states
        setOutput('Data loaded');
      });
    });
  };

  const saveClickCallback = (event) => {
    const hot = hotRef.current?.hotInstance;

    // save all cell's data
    fetch('{{$basePath}}/scripts/json/save.json', {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: hot?.getData() }),
    }).then(() => {
      setOutput('Data saved');
      console.log('The POST request is only used here for the demo purposes');
    });
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button
            id="load"
            className="button button--primary button--blue"
            onClick={loadClickCallback}
          >
            Load data
          </button>
          &nbsp;
          <button
            id="save"
            className="button button--primary button--blue"
            onClick={saveClickCallback}
          >
            Save data
          </button>
          <label>
            <input
              type="checkbox"
              name="autosave"
              id="autosave"
              checked={isAutosave}
              onClick={autosaveClickCallback}
            />
            Autosave
          </label>
        </div>
        <output className="console" id="output">
          {output}
        </output>
      </div>
      <HotTable
        ref={hotRef}
        startRows={8}
        startCols={6}
        rowHeaders={true}
        colHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        afterChange={function (change, source) {
          if (source === 'loadData') {
            return; // don't save this change
          }

          if (!isAutosave) {
            return;
          }

          fetch('{{$basePath}}/scripts/json/save.json', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: change }),
          }).then(() => {
            setOutput(
              `Autosaved (${change?.length} cell${
                (change?.length || 0) > 1 ? 's' : ''
              })`
            );
            console.log(
              'The POST request is only used here for the demo purposes'
            );
          });
        }}
      />
    </>
  );
};

export default ExampleComponent;

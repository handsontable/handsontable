import { useRef } from 'react';
import { createStore } from 'redux';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponentContent = () => {
  const hotSettings = useSelector((state) => state);
  const dispatch = useDispatch();
  const hotTableComponentRef = useRef(null);
  const hotData = hotSettings.data;
  const isHotData = Array.isArray(hotData);
  const onBeforeHotChange = (changes) => {
    dispatch({
      type: 'updateData',
      dataChanges: changes,
    });

    return false;
  };

  const toggleReadOnly = (event) => {
    dispatch({
      type: 'updateReadOnly',
      readOnly: event.target.checked,
    });
  };

  return (
    <div className="dump-example-container">
      <div id="example-container">
        <div id="example-preview">
          <div className="controls">
            <label>
              <input onClick={toggleReadOnly} type="checkbox" />
              Toggle <code>readOnly</code> for the entire table
            </label>
          </div>

          <HotTable
            ref={hotTableComponentRef}
            beforeChange={onBeforeHotChange}
            autoWrapRow={true}
            autoWrapCol={true}
            {...hotSettings}
          />
        </div>
        <h3>Redux store dump</h3>
        <pre id="redux-preview" className="table-container">
          {isHotData && (
            <div>
              <strong>data:</strong>
              <table style={{ border: '1px solid #d6d6d6' }}>
                <tbody>
                  {hotData.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <table>
            <tbody>
              {Object.entries(hotSettings).map(
                ([name, value]) =>
                  name !== 'data' && (
                    <tr key={`${name}${value}`}>
                      <td>
                        <strong>{name}:</strong>
                      </td>
                      <td>{value.toString()}</td>
                    </tr>
                  )
              )}
            </tbody>
          </table>
        </pre>
      </div>
    </div>
  );
};

const initialReduxStoreState = {
  data: [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
    ['A4', 'B4', 'C4'],
    ['A5', 'B5', 'C5'],
  ],
  colHeaders: true,
  rowHeaders: true,
  readOnly: false,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
};

const updatesReducer = (state = initialReduxStoreState, action) => {
  switch (action.type) {
    case 'updateData':
      const newData = [...state.data];

      action.dataChanges.forEach(([row, column, oldValue, newValue]) => {
        newData[row][column] = newValue;
      });

      return {
        ...state,
        data: newData,
      };
    case 'updateReadOnly':
      return {
        ...state,
        readOnly: action.readOnly,
      };
    default:
      return state;
  }
};

const reduxStore = createStore(updatesReducer);
const ExampleComponent = () => (
  <Provider store={reduxStore}>
    <ExampleComponentContent />
  </Provider>
);

export default ExampleComponent;

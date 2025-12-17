import { useState, useEffect, useCallback } from 'react';
import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const inputData = new Array(10) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(10) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

export const data = inputData.map((el) => ({
  ...el,
  stars: Math.floor(Math.random() * 5) + 1,
  feedback: Math.random() > 0.5 ? '👍' : '👎',
}));

export const FeedbackEditor = () => {
  const [config, setConfig] = useState(['👍', '👎', '🤷‍♂️']);
  const [shortcuts, setShortcuts] = useState([]);
  const onPrepare = (_row, _column, _prop, _TD, _originalValue, cellProperties) => {
    setConfig(cellProperties.config);
  };

  useEffect(() => {
    setShortcuts([
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: ({ value, setValue }, _event) => {
          setValue(getNextValue(value));

          return false;
        },
      },
      {
        keys: [['ArrowLeft']],
        callback: ({ value, setValue }, _event) => {
          setValue(getPrevValue(value));
        },
      },
    ]);
  }, [config]);

  const getNextValue = useCallback(
    (value) => {
      const index = config.indexOf(value);

      return index === config.length - 1 ? config[0] : config[index + 1];
    },
    [config]
  );

  const getPrevValue = useCallback(
    (value) => {
      const index = config.indexOf(value);

      return index === 0 ? config[config.length - 1] : config[index - 1];
    },
    [config]
  );

  // const onClose = () => console.log('onClose');
  // const onOpen = () => console.log('onOpen');
  // const onFocus = () => console.log('onFocus');
  return (
    <EditorComponent onPrepare={onPrepare} shortcuts={shortcuts}>
      {({ value, setValue, finishEditing }) => (
        <>
          <style>
            {`
            .editor {
              box-sizing: border-box;
              display: flex;
              gap: 3px;
              padding: 3px;
              background: rgb(238, 238, 238);
              border: 1px solid rgb(204, 204, 204);
              border-radius: 4px;
              height: 100%;
              width: 100%;
            }
            .button.active:hover,
            .button.active {
              background: #007bff;
              color: white;
            }
            .button:hover {
              background: #f0f0f0;
            }
            .button {
              background: #fff;
              color: black;
              border:none;
              padding: 0;
              margin: 0;
              height: 100%;
              width: 100%;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              cursor: pointer;
            }`}
          </style>
          <div className="editor">
            {config.map((item, _index, _array) => (
              <button
                className={`button ${value === item ? 'active' : ''}`}
                key={item}
                onClick={() => {
                  setValue(item);
                  finishEditing();
                }}
                style={{
                  width: `${100 / _array.length}%`,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}
    </EditorComponent>
  );
};

const ExampleComponent = () => {
  return (
    <HotTable
      autoRowSize={true}
      rowHeaders={true}
      autoWrapRow={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      themeName="ht-theme-main"
      data={data}
      colHeaders={true}
    >
      <HotColumn width={250} editor={FeedbackEditor} config={['👍', '👎', '🤷‍♂️']} data="feedback" title="Feedback" />
      <HotColumn
        width={250}
        editor={FeedbackEditor}
        config={['1', '2', '3', '4', '5']}
        data="stars"
        title="Rating (1-5)"
      />
    </HotTable>
  );
};

export default ExampleComponent;

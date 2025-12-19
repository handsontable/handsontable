import { useState, useEffect, ComponentProps, useCallback, useContext } from 'react';
import { HotTable, HotColumn, EditorComponent, EditorContext } from '@handsontable/react-wrapper';
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
  stars: Math.floor(Math.random() * (5)) + 1,
  feedback: Math.random() > 0.5 ? "👍" : "👎",
}));


type EditorComponentProps = ComponentProps<typeof EditorComponent<string>>;

export const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷‍♂️']);
  const [shortcuts, setShortcuts] = useState<EditorComponentProps['shortcuts']>([]);
  const { hotCustomEditorInstanceRef } = useContext(EditorContext);  
  const onPrepare: EditorComponentProps['onPrepare'] = (_row, _column, _prop, _TD, _originalValue, cellProperties) => {
    setConfig(cellProperties.config as string[]);
  };

  useEffect(() => {
    setShortcuts([
      {
        keys: [['ArrowRight'], ['Tab']],
        callback: ({value, setValue}, _event) => {
          setValue(getNextValue(value));      
          return false;
        }
      }, 
      {
        keys: [['ArrowLeft']],
        callback: ({value, setValue}, _event) => {
          setValue(getPrevValue(value));     
        }
      }
    ])
  }, [config]);

  const getNextValue = useCallback((value: string) => {
    const index = config.indexOf(value);
    return index === config.length - 1 ? config[0] : config[index + 1];
  }, [config]);

  const getPrevValue = useCallback((value: string) => {
    const index = config.indexOf(value);
    return index === 0 ? config[config.length - 1] : config[index - 1];
  }, [config]);

  return (
    <EditorComponent<string> onPrepare={onPrepare} shortcuts={shortcuts}>
      {({ value, setValue, finishEditing }) => (
        <>
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
                  width: 100 / _array.length + '%'
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
      <HotColumn width={250} editor={FeedbackEditor} config={['1', '2', '3', '4', '5']} data="stars" title="Rating (1-5)" />
    </HotTable>
  );
};

export default ExampleComponent;

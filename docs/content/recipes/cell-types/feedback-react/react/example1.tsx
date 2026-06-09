import { useState, useEffect, ComponentProps, useCallback } from 'react';
import { HotTable, HotColumn, EditorComponent } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

// register Handsontable's modules
registerAllModules();

/* start:skip-in-preview */

export const data = [
  { feature: 'Dark Mode', category: 'UI', priority: 'High', feedback: '👍', votes: 124, status: 'Planned' },
  { feature: 'Bulk Edit', category: 'Core', priority: 'High', feedback: '👍', votes: 98, status: 'In Progress' },
  { feature: 'AI Suggestions', category: 'Beta', priority: 'Medium', feedback: '🤷', votes: 45, status: 'Research' },
  { feature: 'Offline Mode', category: 'Infra', priority: 'Low', feedback: '👎', votes: 12, status: 'Backlog' },
];

/* end:skip-in-preview */


type EditorComponentProps = ComponentProps<typeof EditorComponent<string>>;

export const FeedbackEditor = () => {
  const [config, setConfig] = useState<string[]>(['👍', '👎', '🤷']);
  const [shortcuts, setShortcuts] = useState<EditorComponentProps['shortcuts']>([]);
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
          <div className="feedback-editor">
            {config.map((item, _index, _array) => (
              <button
                className={value === item ? 'active' : ''}
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
      width="100%"
      data={data}
      colHeaders={['Feature', 'Category', 'Priority', 'Feedback', 'Votes', 'Status']}
      headerClassName="htLeft"
    >
      <HotColumn data="feature" type="text" width={200} />
      <HotColumn data="category" type="text" width={90} />
      <HotColumn data="priority" type="text" width={100} />
      <HotColumn data="feedback" type="text" width={100} editor={FeedbackEditor} config={['👍', '👎', '🤷']} />
      <HotColumn data="votes" type="numeric" width={60} />
      <HotColumn data="status" type="text" width={120} />
    </HotTable>
  );
};

export default ExampleComponent;

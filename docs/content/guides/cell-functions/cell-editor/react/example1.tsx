import { MouseEvent, useRef } from 'react';
import { HotTable, HotColumn, useHotEditor } from '@handsontable/react-wrapper';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const EditorComponent = () => {
  const mainElementRef = useRef<HTMLDivElement>(null);

  const { value, setValue, finishEditing } = useHotEditor({
    onOpen: () => {
      if (!mainElementRef.current) return;

      mainElementRef.current.style.display = 'block';
    },
    onClose: () => {
      if (!mainElementRef.current) return;

      mainElementRef.current.style.display = 'none';
    },
    onPrepare: (_row, _column, _prop, TD, _originalValue, _cellProperties) => {
      const tdPosition = TD.getBoundingClientRect();

      // As the `prepare` method is triggered after selecting
      // any cell, we're updating the styles for the editor element,
      // so it shows up in the correct position.
      if (!mainElementRef.current) return;
      mainElementRef.current.style.left = `${
        tdPosition.left + window.pageXOffset
      }px`;
      mainElementRef.current.style.top = `${
        tdPosition.top + window.pageYOffset
      }px`;
    },
    onFocus: () => {},
  });

  const setLowerCase = () => {
    setValue(value.toString().toLowerCase());
    finishEditing();
  };

  const setUpperCase = () => {
    setValue(value.toString().toUpperCase());
    finishEditing();
  };

  const stopMousedownPropagation = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const buttonValue = value || '';

  return (
    <div
      id="editorElement"
      ref={mainElementRef}
      style={{
        display: 'none',
        position: 'absolute',
        left: 0,
        top: 0,
        background: '#fff',
        border: '1px solid #000',
        padding: '15px',
        zIndex: 999,
      }}
      onMouseDown={stopMousedownPropagation}
    >
      <button onClick={setLowerCase.bind(this)}>
        {buttonValue.toLowerCase()}
      </button>
      <button onClick={setUpperCase.bind(this)}>
        {buttonValue.toUpperCase()}
      </button>
    </div>
  );
};

const data = [
  ['Obrien Fischer'],
  ['Alexandria Gordon'],
  ['John Stafford'],
  ['Regina Waters'],
  ['Kay Bentley'],
  ['Emerson Drake'],
  ['Dean Stapleton'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn width={250} editor={EditorComponent} />
    </HotTable>
  );
};

export default ExampleComponent;

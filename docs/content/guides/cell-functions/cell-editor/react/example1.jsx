import React from 'react';
import { HotTable, HotColumn, useHotEditor } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

// an editor component
const EditorComponent = (props) => {
  const mainElementRef = React.useRef();
  const containerStyle = {
    display: 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    background: '#fff',
    border: '1px solid #000',
    padding: '15px',
    zIndex: 999
  };

  // A hook that takes a set of methods that your custom editor needs to override.
  // It also provides partial editor API in case other functions need to access it, like `finishEditing`.
  const { value, setValue, finishEditing } = useHotEditor({
    onOpen() {
      mainElementRef.current.style.display = 'block';
    },

    onClose() {
      mainElementRef.current.style.display = 'none';
    },

    onPrepare(row, col, prop, td, originalValue, cellProperties) {
      const tdPosition = td.getBoundingClientRect();

      // As the `prepare` method is triggered after selecting
      // any cell, we're updating the styles for the editor element,
      // so it shows up in the correct position.
      mainElementRef.current.style.left = tdPosition.left + window.pageXOffset + 'px';
      mainElementRef.current.style.top = tdPosition.top + window.pageYOffset + 'px';
    }
  });

  const setLowerCase = React.useCallback(() => {
    setValue(value.toString().toLowerCase());

    // Close the editor by the editor API method.
    finishEditing();
  }, [setValue, value, finishEditing]);

  const setUpperCase = React.useCallback(() => {
    setValue(value.toString().toUpperCase());

    // Close the editor by the editor API method.
    finishEditing();
  }, [setValue, value, finishEditing]);

  const stopMousedownPropagation = React.useCallback((e) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      style={containerStyle}
      ref={mainElementRef}
      onMouseDown={stopMousedownPropagation}
      id="editorElement"
    >
      <button onClick={setLowerCase}>
        {value?.toLowerCase()}
      </button>
      <button onClick={setUpperCase}>
        {value?.toUpperCase()}
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
  ['Dean Stapleton']
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
      {/* add the `editor` prop to set the component as a Handsontable editor */}
      <HotColumn width={250} editor={EditorComponent} />
    </HotTable>
  );
};

export default ExampleComponent;

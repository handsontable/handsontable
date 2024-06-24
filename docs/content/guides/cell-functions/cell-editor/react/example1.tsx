import React, { MouseEvent } from 'react';
import Handsontable from 'handsontable';
import { HotTable, HotColumn, BaseEditorComponent } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

// an editor component
class EditorComponent extends BaseEditorComponent {
  mainElementRef: React.RefObject<HTMLDivElement>;

  constructor(props: BaseEditorComponent['props']) {
    super(props);

    this.mainElementRef = React.createRef();
    this.state = {
      value: '',
    };
  }

  setValue(value: any, callback: (() => void) | undefined) {
    this.setState((_state, _props) => {
      return { value };
    }, callback);
  }

  getValue() {
    return this.state.value;
  }

  open() {
    if (!this.mainElementRef.current) return;
    this.mainElementRef.current.style.display = 'block';
  }

  close() {
    if (!this.mainElementRef.current) return;
    this.mainElementRef.current.style.display = 'none';
  }

  prepare(
    row: number,
    col: number,
    prop: string,
    td: HTMLTableColElement,
    originalValue: string,
    cellProperties: Handsontable.CellProperties,
  ) {
    // We'll need to call the `prepare` method from
    // the `BaseEditorComponent` class, as it provides
    // the component with the information needed to use the editor
    // (hotInstance, row, col, prop, TD, originalValue, cellProperties)
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    // As the `prepare` method is triggered after selecting
    // any cell, we're updating the styles for the editor element,
    // so it shows up in the correct position.
    if (!this.mainElementRef.current) return;
    this.mainElementRef.current.style.left = `${tdPosition.left + window.pageXOffset}px`;
    this.mainElementRef.current.style.top = `${tdPosition.top + window.pageYOffset}px`;
  }

  setLowerCase() {
    this.setState(
      (state, props) => {
        return { value: this.state.value.toString().toLowerCase() };
      },
      () => {
        this.finishEditing();
      },
    );
  }

  setUpperCase() {
    this.setState(
      (state, props) => {
        return { value: this.state.value.toString().toUpperCase() };
      },
      () => {
        this.finishEditing();
      },
    );
  }

  stopMousedownPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  render() {
    return (
      <div
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
        ref={this.mainElementRef}
        onMouseDown={this.stopMousedownPropagation}
        id="editorElement"
      >
        <button onClick={this.setLowerCase.bind(this)}>
          {this.state.value.toLowerCase()}
        </button>
        <button onClick={this.setUpperCase.bind(this)}>
          {this.state.value.toUpperCase()}
        </button>
      </div>
    );
  }
}

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
      <HotColumn width={250}>
        {/* add the `hot-editor` attribute to mark the component as a Handsontable editor */}
        <EditorComponent hot-editor />
      </HotColumn>
    </HotTable>
  );
};

export default ExampleComponent;

import React from 'react';
import { HotTable, HotColumn, BaseEditorComponent } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.min.css';

// an editor component
class EditorComponent extends BaseEditorComponent {
  constructor(props) {
    super(props);

    this.mainElementRef = React.createRef();
    this.containerStyle = {
      display: 'none',
      position: 'absolute',
      left: 0,
      top: 0,
      background: '#fff',
      border: '1px solid #000',
      padding: '15px',
      zIndex: 999
    };
    this.state = {
      value: ''
    };
  }

  setValue(value, callback) {
    this.setState((state, props) => {
      return { value: value };
    }, callback);
  }

  getValue() {
    return this.state.value;
  }

  open() {
    this.mainElementRef.current.style.display = 'block';
  }

  close() {
    this.mainElementRef.current.style.display = 'none';
  }

  prepare(row, col, prop, td, originalValue, cellProperties) {
    // We'll need to call the `prepare` method from
    // the `BaseEditorComponent` class, as it provides
    // the component with the information needed to use the editor
    // (hotInstance, row, col, prop, TD, originalValue, cellProperties)
    super.prepare(row, col, prop, td, originalValue, cellProperties);

    const tdPosition = td.getBoundingClientRect();

    // As the `prepare` method is triggered after selecting
    // any cell, we're updating the styles for the editor element,
    // so it shows up in the correct position.
    this.mainElementRef.current.style.left = tdPosition.left + window.pageXOffset + 'px';
    this.mainElementRef.current.style.top = tdPosition.top + window.pageYOffset + 'px';
  }

  setLowerCase() {
    this.setState(
      (state, props) => {
        return { value: this.state.value.toString().toLowerCase() };
      },
      () => {
        this.finishEditing();
      }
    );
  }

  setUpperCase() {
    this.setState(
      (state, props) => {
        return { value: this.state.value.toString().toUpperCase() };
      },
      () => {
        this.finishEditing();
      }
    );
  }

  stopMousedownPropagation(e) {
    e.stopPropagation();
  }

  render() {
    return (
        <div
          style={this.containerStyle}
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
      <HotColumn width={250}>
        {/* add the `hot-editor` attribute to mark the component as a Handsontable editor */}
        <EditorComponent hot-editor />
      </HotColumn>
    </HotTable>
  );
};

export default ExampleComponent;

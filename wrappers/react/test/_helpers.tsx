import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { BaseEditorComponent } from '../src/baseEditorComponent';

const SPEC = {
  container: null,
  root: null,
};

beforeEach(() => {
  const container = document.createElement('DIV');

  container.id = 'hotContainer';
  document.body.appendChild(container);
  SPEC.container = container;
  SPEC.root = createRoot(SPEC.container);
});

afterEach(() => {
  const container = document.querySelector('#hotContainer');

  container.parentNode.removeChild(container);
  SPEC.container = null;

  act(() => {
    SPEC.root.unmount();
  });
});

export function mountComponentWithRef(Component, strictMode = true) {
  let hotTableComponent = null;

  const App = () => {
    hotTableComponent = useRef(null);

    return (
      <Component.type {...Component.props} ref={hotTableComponent}></Component.type>
    );
  }

  act(() => {
    SPEC.root.render(
      strictMode ? <React.StrictMode><App/></React.StrictMode> : <App/>
    );
  });

  return hotTableComponent.current;
}

export function mountComponent(Component) {
  const App = () => {
    return (
      <Component.type {...Component.props}></Component.type>
    );
  }

  act(() => {
    SPEC.root.render(<React.StrictMode><App/></React.StrictMode>);
  });
}

export function sleep(delay = 100) {
  return Promise.resolve({
    then(resolve) {
      if (delay === 0) {
        setImmediate(resolve);
      } else {
        setTimeout(resolve, delay);
      }
    }
  });
}

/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 *
 * @param {number} index Column index.
 * @returns {string}
 */
export function spreadsheetColumnLabel(index) {
  let dividend = index + 1;
  let columnLabel = '';
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26, 10);
  }

  return columnLabel;
}

/**
 * Creates 2D array of Excel-like values "A1", "A2", ...
 *
 * @param {number} rows Number of rows to generate.
 * @param {number} columns Number of columns to generate.
 * @returns {Array}
 */
export function createSpreadsheetData(rows = 100, columns = 4) {
  const _rows = [];
  let i;
  let j;

  for (i = 0; i < rows; i++) {
    const row = [];

    for (j = 0; j < columns; j++) {
      row.push(spreadsheetColumnLabel(j) + (i + 1));
    }
    _rows.push(row);
  }

  return _rows;
}

export function mockElementDimensions(element, width, height) {
  Object.defineProperty(element, 'clientWidth', {
    value: width
  });
  Object.defineProperty(element, 'clientHeight', {
    value: height
  });

  Object.defineProperty(element, 'offsetWidth', {
    value: width
  });
  Object.defineProperty(element, 'offsetHeight', {
    value: height
  });
}

export function simulateKeyboardEvent(type, keyCode) {
  const newEvent = document.createEvent('KeyboardEvent');
  const KEY_CODES = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    16: 'shift',
    17: 'control',
    18: 'alt',
    27: 'escape'
  };

  // Chromium Hack
  Object.defineProperty(newEvent, 'keyCode', {
    get : function() {
        return this.keyCodeVal;
    }
  });
  Object.defineProperty(newEvent, 'which', {
      get : function() {
          return this.keyCodeVal;
      }
  });
  Object.defineProperty(newEvent, 'key', {
    get : function() {
      return KEY_CODES[this.keyCodeVal] ?? String.fromCharCode(this.keyCodeVal).toLowerCase();
    }
  });

  if ((newEvent as any).initKeyboardEvent !== void 0) {
    newEvent.initKeyboardEvent(type, true, true, window, keyCode, keyCode, '', '', false, '');
  } else {
    newEvent.initKeyEvent(type, true, true, window, false, false, false, false, keyCode, 0);
  }

  newEvent.keyCodeVal = keyCode;

  document.activeElement.dispatchEvent(newEvent);
}

export function simulateMouseEvent(element, type) {
  const event = document.createEvent('Events');
  event.initEvent(type, true, false);

  element.dispatchEvent(event);
}

class IndividualPropsWrapper extends React.Component<{ref?: string, id?: string}, {hotSettings?: object}> {
  hotTable: typeof HotTable;
  state = {};

  private setHotElementRef(component: typeof HotTable): void {
    this.hotTable = component;
  }

  render(): React.ReactElement {
    return (
      <div>
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          ref={this.setHotElementRef.bind(this)}
          id="hot" {...this.state.hotSettings}
          autoRowSize={false}
          autoColumnSize={false}
        />
      </div>
    );
  }
}

export { IndividualPropsWrapper };

class SingleObjectWrapper extends React.Component<{ref?: string, id?: string}, {hotSettings?: object}> {
  hotTable: typeof HotTable;
  state = {};

  private setHotElementRef(component: typeof HotTable): void {
    this.hotTable = component;
  }

  render(): React.ReactElement {
    return (
      <div>
        <HotTable
          licenseKey="non-commercial-and-evaluation"
          ref={this.setHotElementRef.bind(this)}
          id="hot"
          settings={this.state.hotSettings}
          autoRowSize={false}
          autoColumnSize={false}
        />
      </div>
    );
  }
}

export { SingleObjectWrapper };

export class RendererComponent extends React.Component<any, any> {
  render(): React.ReactElement<string> {
    return (
      <>
        value: {this.props.value}
      </>
    );
  }
}

export class EditorComponent extends BaseEditorComponent<{}, {value?: any}> {
  mainElementRef: any;
  containerStyle: any;

  constructor(props) {
    super(props);

    this.mainElementRef = React.createRef();

    this.state = {
      value: ''
    };

    this.containerStyle = {
      display: 'none'
    };
  }

  getValue() {
    return this.state.value;
  }

  setValue(value, callback) {
    this.setState((state, props) => {
      return {value: value};
    }, callback);
  }

  setNewValue() {
    this.setValue('new-value', () => {
      this.finishEditing();
    })
  }

  open() {
    this.mainElementRef.current.style.display = 'block';
  }

  close() {
    this.mainElementRef.current.style.display = 'none';
  }

  render(): React.ReactElement<string> {
    return (
      <div style={this.containerStyle} ref={this.mainElementRef} id="editorComponentContainer">
        <button onClick={this.setNewValue.bind(this)}></button>
      </div>
    );
  }
}

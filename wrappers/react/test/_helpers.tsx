import React from 'react';
import { createRoot } from 'react-dom/client';
import Handsontable from 'handsontable';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { HotRendererProps, HotTableRef, HotTableProps } from '../src/types'
import { useHotEditor } from "../src/hotEditor";

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
    hotTableComponent = React.useRef(null);

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

export function renderHotTableWithProps(props: HotTableProps, strictMode = true, hotTableRef: React.RefObject<HotTableRef> = React.createRef()): React.RefObject<HotTableRef> {
  act(() => {
    SPEC.root.render(
      strictMode
          ? <React.StrictMode><HotTable {...props} ref={hotTableRef} /></React.StrictMode>
          : <HotTable {...props} ref={hotTableRef} />
    );
  });

  return hotTableRef;
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

export const RendererComponent: React.FC<HotRendererProps & { tap?: (props: HotRendererProps) => void }> = ({ tap, ...props }) => {
  tap?.(props);

  return (
    <>
      value: {props.value}
    </>
  );
}

export const customNativeRenderer: Handsontable.renderers.BaseRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, `value: ${value}`, cellProperties]);
  return td;
}

interface EditorComponentProps {
  className?: string
  background?: string
  tap?: (props: EditorComponentProps) => void
}

export const EditorComponent: React.FC<EditorComponentProps> = ({ tap, ...props }) => {
  const mainElementRef = React.useRef<HTMLDivElement>(null)
  const containerStyle = {
    display: 'none'
  };

  const valueRef = React.useRef('');

  const hotCustomEditorInstanceRef = useHotEditor((runSuper) => ({
    getValue() {
      return valueRef.current;
    },

    setValue(value) {
      valueRef.current = value;
    },

    prepare(row, col, prop, TD, originalValue, cellProperties): any {
      runSuper().prepare(row, col, prop, TD, originalValue, cellProperties)
      mainElementRef.current.style.backgroundColor = props.background;
    },

    open() {
      mainElementRef.current.style.display = 'block';
    },

    close() {
      mainElementRef.current.style.display = 'none';
    }
  }), [valueRef]);

  const setNewValue = React.useCallback(() => {
    valueRef.current = 'new-value';
    hotCustomEditorInstanceRef.current.finishEditing();
  }, [valueRef, mainElementRef]);

  tap?.(props);

  return (
    <div style={containerStyle} ref={mainElementRef} id="editorComponentContainer" className={props.className}>
      <button onClick={setNewValue}></button>
    </div>
  );
};

export class CustomNativeEditor extends Handsontable.editors.BaseEditor {
  init() {
    this.TEXTAREA = document.createElement('TEXTAREA');
    this.TEXTAREA_PARENT = document.createElement('DIV');

    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
    this.hot.rootElement.appendChild(this.TEXTAREA_PARENT);
  }
  getValue() {
    return `--${this.TEXTAREA.value}--`;
  }
  setValue(value) {
    this.TEXTAREA.value = value;
  }
  open() {}
  close() {}
  focus() {
    this.TEXTAREA.focus();
  }
}

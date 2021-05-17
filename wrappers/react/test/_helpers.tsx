import React from 'react';
import { HotTable } from '../src/hotTable';
import { addUnsafePrefixes } from '../src/helpers';
import { BaseEditorComponent } from '../src/baseEditorComponent';

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
  // const init = (event as any).initKeyboardEvent !== void 0 ? 'initKeyboardEvent' : 'initKeyEvent';

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

  constructor(props) {
    super(props);

    addUnsafePrefixes(this);
  }

  componentWillMount() {
    this.setState({});
  }

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

  constructor(props) {
    super(props);

    addUnsafePrefixes(this);
  }

  private setHotElementRef(component: typeof HotTable): void {
    this.hotTable = component;
  }

  componentWillMount() {
    this.setState({});
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

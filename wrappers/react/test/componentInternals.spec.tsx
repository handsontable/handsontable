import React from 'react';
import { act } from '@testing-library/react';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  sleep,
} from './_helpers';
import { HOT_DESTROYED_WARNING } from "../src/helpers";
import { BaseEditorComponent } from '../src/baseEditorComponent';

describe('Subcomponent state', () => {
  it('should be possible to set the state of the renderer components passed to HotTable and HotColumn', async () => {
    class RendererComponent2 extends React.Component<any, any, any> {
      constructor(props) {
        super(props);

        this.state = {
          value: 'initial'
        }
      }

      render(): React.ReactElement<string> {
        return (
          <>
            {this.state.value}
          </>
        );
      }
    }

    let zeroRendererInstance = null;
    let oneRendererInstance = null;

    const hotInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent2 ref={function (instance) {
          if (instance && instance.props.row === 0 && instance.props.col === 0) {
            zeroRendererInstance = instance;
          }
        }} hot-renderer></RendererComponent2>
        <HotColumn/>
        <HotColumn>
          <RendererComponent2 ref={function (instance) {
            if (instance && instance.props.row === 0 && instance.props.col === 1) {
              oneRendererInstance = instance;
            }
          }} hot-renderer></RendererComponent2>
        </HotColumn>
      </HotTable>
    )).hotInstance;

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>initial</div>');
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>initial</div>');

    await act(async () => {
      zeroRendererInstance.setState({
        value: 'altered'
      });

      oneRendererInstance.setState({
        value: 'altered as well'
      });
    });

    expect(hotInstance.getCell(0, 0).innerHTML).toEqual('<div>altered</div>');
    expect(hotInstance.getCell(0, 1).innerHTML).toEqual('<div>altered as well</div>');
  });

  it('should be possible to set the state of the editor components passed to HotTable and HotColumn', async () => {
    class RendererEditor2 extends BaseEditorComponent {
      constructor(props) {
        super(props);

        this.state = {
          value: 'initial'
        }
      }

      render(): React.ReactElement<string> {
        return (
          <div id={this.props.editorId}>
            {this.state.value}
          </div>
        );
      }
    }

    let globalEditorInstance = null;
    let columnEditorInstance = null;

    mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererEditor2 editorId={'first-editor'} ref={function (instance) {
          globalEditorInstance = instance;
        }} hot-editor></RendererEditor2>
        <HotColumn/>
        <HotColumn>
          <RendererEditor2 editorId={'second-editor'} ref={function (instance) {
            columnEditorInstance = instance;
          }} hot-editor></RendererEditor2>
        </HotColumn>
      </HotTable>
    ));

    expect(document.querySelector('#first-editor').innerHTML).toEqual('initial');
    expect(document.querySelector('#second-editor').innerHTML).toEqual('initial');

    await act(async () => {
      globalEditorInstance.setState({
        value: 'altered'
      });

      columnEditorInstance.setState({
        value: 'altered as well'
      });
    });

    expect(document.querySelector('#first-editor').innerHTML).toEqual('altered');
    expect(document.querySelector('#second-editor').innerHTML).toEqual('altered as well');
  });
});

describe('Component lifecyle', () => {
  it('renderer components should trigger their lifecycle methods', async () => {
    class RendererComponent2 extends React.Component<any, any, any> {
      constructor(props) {
        super(props);

        rendererCounters.set(`${this.props.row}-${this.props.col}`, {
          didMount: 0,
          willUnmount: 0
        });
      }

      componentDidMount(): void {
        const counters = rendererCounters.get(`${this.props.row}-${this.props.col}`);
        counters.didMount++;
      }

      componentWillUnmount(): void {
        const counters = rendererCounters.get(`${this.props.row}-${this.props.col}`);
        counters.willUnmount++;
      }

      render(): React.ReactElement<string> {
        return (
          <>
            test
          </>
        );
      }
    }

    let secondGo = false;
    const rendererRefs = new Map();
    const rendererCounters = new Map();

    const hotInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        <RendererComponent2 ref={function (instance) {
          if (!secondGo && instance) {
            rendererRefs.set(`${instance.props.row}-${instance.props.col}`, instance);
          }
        }} hot-renderer></RendererComponent2>
        <HotColumn/>
        <HotColumn>
          <RendererComponent2 ref={function (instance) {
            if (!secondGo && instance) {
              rendererRefs.set(`${instance.props.row}-${instance.props.col}`, instance);
            }
          }} hot-renderer></RendererComponent2>
        </HotColumn>
      </HotTable>
    ), false).hotInstance;

    rendererCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(0);
    });

    secondGo = true;

    await act(async () => {
      hotInstance.render();
    });

    await sleep(300);

    rendererCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(0);
    });
  });

  it('editor components should trigger their lifecycle methods', async () => {
    class EditorComponent2 extends BaseEditorComponent {
      constructor(props) {
        super(props);

        editorCounters.set(`${this.props.row}-${this.props.col}`, {
          didMount: 0,
          willUnmount: 0
        });
      }

      componentDidMount(): void {
        const counters = editorCounters.get(`${this.props.row}-${this.props.col}`);
        counters.didMount++;
      }

      componentWillUnmount(): void {
        const counters = editorCounters.get(`${this.props.row}-${this.props.col}`);
        counters.willUnmount++;
      }

      render(): React.ReactElement<string> {
        return (
          <>
            test
          </>
        );
      }
    }

    let secondGo = false;
    const editorRefs = new Map();
    const editorCounters = new Map();
    const childrenArray = [
      <EditorComponent2 ref={function (instance) {
        if (!secondGo && instance) {
          editorRefs.set(`EditorComponent2`, instance);
        }
      }} hot-editor key={Math.random()}></EditorComponent2>
    ];

    const hotTableInstance = mountComponentWithRef((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(3, 2)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}>
        {childrenArray}
      </HotTable>
    ), false);

    editorCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(0);
    });

    secondGo = true;

    childrenArray.length = 0;

    await act(async () => {
      hotTableInstance.forceUpdate();
    });

    await sleep(100);

    editorCounters.forEach((counters) => {
      expect(counters.didMount).toEqual(1);
      expect(counters.willUnmount).toEqual(1);
    });
  });

  it('should display a warning and not throw any errors, when the underlying Handsontable instance ' +
    'has been destroyed', async () => {
    const warnFunc = console.warn;
    const warnCalls = [];

    const componentInstance = mountComponentWithRef((
      <HotTable
        id="test-hot"
        data={[[2]]}
        licenseKey="non-commercial-and-evaluation"
      />
    ));

    console.warn = (warningMessage) => {
      warnCalls.push(warningMessage);
    };

    expect(componentInstance.hotInstance.isDestroyed).toEqual(false);

    componentInstance.hotInstance.destroy();

    expect(componentInstance.hotInstance).toEqual(null);

    expect(warnCalls.length).toBeGreaterThan(0);
    warnCalls.forEach((message) => {
      expect(message).toEqual(HOT_DESTROYED_WARNING);
    });

    console.warn = warnFunc;
  });
});
